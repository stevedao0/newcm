import { supabaseService } from './supabaseService';

// Database service with Supabase backend and localStorage fallback
export interface DatabaseConfig {
  name: string;
  version: number;
  tables: string[];
}

class DatabaseService {
  private config: DatabaseConfig;
  private useSupabase: boolean = false;
  private syncQueue: any[] = [];
  private listeners: Map<string, Set<() => void>> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.config = {
      name: 'contract_management',
      version: 1,
      tables: ['contracts', 'works', 'partners', 'channels', 'users', 'notifications']
    };
    this.initializeDatabase();
    this.checkSupabaseConnection();
  }

  private async checkSupabaseConnection() {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        // Test connection
        await supabaseService.getStats();
        this.useSupabase = true;
        console.log('✅ Connected to Supabase database');
        
        // Migrate existing localStorage data if any
        const hasLocalData = this.config.tables.some(table => {
          const data = localStorage.getItem(table);
          return data && JSON.parse(data).length > 0;
        });
        
        if (hasLocalData) {
          console.log('🔄 Found localStorage data, migrating to Supabase...');
          await supabaseService.migrateFromLocalStorage();
          console.log('✅ Migration completed');
        }
      } else {
        console.log('⚠️ Supabase not configured, using localStorage fallback');
        this.useSupabase = false;
      }
    } catch (error) {
      console.warn('⚠️ Supabase connection failed, using localStorage fallback:', error);
      this.useSupabase = false;
    }
  }

  private initializeDatabase() {
    try {
      // Initialize tables if they don't exist
      this.config.tables.forEach(table => {
        if (!localStorage.getItem(table)) {
          localStorage.setItem(table, JSON.stringify([]));
        }
      });

      // Set up metadata
      if (!localStorage.getItem('db_metadata')) {
        localStorage.setItem('db_metadata', JSON.stringify({
          version: this.config.version,
          lastSync: new Date().toISOString(),
          deviceId: this.generateDeviceId()
        }));
      }

      this.initialized = true;
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      this.initialized = false;
    }
  }

  private generateDeviceId(): string {
    return 'device_' + Math.random().toString(36).substr(2, 9);
  }

  private notifyListeners(table: string) {
    const tableListeners = this.listeners.get(table);
    if (tableListeners) {
      // Use setTimeout to ensure async notification
      setTimeout(() => {
        tableListeners.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('Error in database listener:', error);
          }
        });
      }, 10); // Small delay for proper UI updates
    }
  }

  // Subscribe to table changes - ENHANCED
  subscribe(table: string, callback: () => void) {
    if (this.useSupabase) {
      return supabaseService.subscribe(table, callback);
    }
    
    if (!this.listeners.has(table)) {
      this.listeners.set(table, new Set());
    }
    this.listeners.get(table)!.add(callback);

    console.log(`📡 Subscribed to ${table} changes`);

    // Return unsubscribe function
    return () => {
      const tableListeners = this.listeners.get(table);
      if (tableListeners) {
        tableListeners.delete(callback);
        console.log(`📡 Unsubscribed from ${table} changes`);
      }
    };
  }

  // CRUD operations with proper notifications
  async create(table: string, data: any): Promise<any> {
    if (this.useSupabase) {
      try {
        const result = await supabaseService.create(table, data);
        this.notifyListeners(table);
        return result;
      } catch (error) {
        console.error('Supabase create error, falling back to localStorage:', error);
        // Fall back to localStorage
      }
    }
    
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const items = this.getAll(table);
      const newItem = {
        ...data,
        id: data.id || this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      items.push(newItem);
      localStorage.setItem(table, JSON.stringify(items));
      
      console.log(`✅ Created item in ${table}:`, newItem.id);
      
      // Notify listeners
      this.notifyListeners(table);
      
      return newItem;
    } catch (error) {
      console.error('❌ Error creating item:', error);
      throw error;
    }
  }

  getAll(table: string): any[] {
    if (this.useSupabase) {
      // For Supabase, we need to use async methods
      // This method will be deprecated in favor of async getAll
      console.warn('getAll is synchronous, use getAllAsync for Supabase');
      return [];
    }
    
    if (!this.initialized) {
      return [];
    }

    try {
      const data = localStorage.getItem(table);
      const items = data ? JSON.parse(data) : [];
      console.log(`📊 Retrieved ${items.length} items from ${table}`);
      return items;
    } catch (error) {
      console.error('❌ Error getting all items:', error);
      return [];
    }
  }

  async getAllAsync(table: string): Promise<any[]> {
    if (this.useSupabase) {
      try {
        return await supabaseService.getAll(table);
      } catch (error) {
        console.error('Supabase getAll error, falling back to localStorage:', error);
        // Fall back to localStorage
      }
    }
    
    return this.getAll(table);
  }

  getById(table: string, id: string): any | null {
    try {
      const items = this.getAll(table);
      return items.find(item => item.id === id) || null;
    } catch (error) {
      console.error('❌ Error getting item by id:', error);
      return null;
    }
  }

  async update(table: string, id: string, data: any): Promise<any> {
    if (this.useSupabase) {
      try {
        const result = await supabaseService.update(table, id, data);
        this.notifyListeners(table);
        return result;
      } catch (error) {
        console.error('Supabase update error, falling back to localStorage:', error);
        // Fall back to localStorage
      }
    }
    
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const items = this.getAll(table);
      const index = items.findIndex(item => item.id === id);
      
      if (index === -1) {
        throw new Error(`Item with id ${id} not found in table ${table}`);
      }
      
      const updatedItem = {
        ...items[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      items[index] = updatedItem;
      localStorage.setItem(table, JSON.stringify(items));
      
      console.log(`✅ Updated item in ${table}:`, id);
      
      // Notify listeners
      this.notifyListeners(table);
      
      return updatedItem;
    } catch (error) {
      console.error('❌ Error updating item:', error);
      throw error;
    }
  }

  async delete(table: string, id: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        await supabaseService.delete(table, id);
        this.notifyListeners(table);
        return true;
      } catch (error) {
        console.error('Supabase delete error, falling back to localStorage:', error);
        // Fall back to localStorage
      }
    }
    
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const items = this.getAll(table);
      const filteredItems = items.filter(item => item.id !== id);
      
      if (items.length === filteredItems.length) {
        return false;
      }
      
      localStorage.setItem(table, JSON.stringify(filteredItems));
      
      console.log(`✅ Deleted item from ${table}:`, id);
      
      // Notify listeners
      this.notifyListeners(table);
      
      return true;
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      return false;
    }
  }

  // Bulk operations for import - ENHANCED
  async bulkCreate(table: string, items: any[]): Promise<any[]> {
    if (this.useSupabase) {
      try {
        const result = await supabaseService.bulkCreate(table, items);
        this.notifyListeners(table);
        return result;
      } catch (error) {
        console.error('Supabase bulkCreate error, falling back to localStorage:', error);
        // Fall back to localStorage
      }
    }
    
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const existingItems = this.getAll(table);
      const newItems = items.map(item => ({
        ...item,
        id: item.id || this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      const allItems = [...existingItems, ...newItems];
      localStorage.setItem(table, JSON.stringify(allItems));
      
      console.log(`✅ Bulk created ${newItems.length} items in ${table}`);
      
      // Notify listeners
      this.notifyListeners(table);
      
      return newItems;
    } catch (error) {
      console.error('❌ Error bulk creating items:', error);
      throw error;
    }
  }

  async bulkUpdate(table: string, items: any[]): Promise<any[]> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const existingItems = this.getAll(table);
      const updatedItems: any[] = [];
      
      // Create a map for faster lookups
      const itemMap = new Map(existingItems.map(item => [item.id, item]));
      
      items.forEach(updateItem => {
        if (itemMap.has(updateItem.id)) {
          const existingItem = itemMap.get(updateItem.id)!;
          const updatedItem = {
            ...existingItem,
            ...updateItem,
            updatedAt: new Date().toISOString()
          };
          itemMap.set(updateItem.id, updatedItem);
          updatedItems.push(updatedItem);
        }
      });
      
      // Convert map back to array
      const newItems = Array.from(itemMap.values());
      localStorage.setItem(table, JSON.stringify(newItems));
      
      console.log(`✅ Bulk updated ${updatedItems.length} items in ${table}`);
      
      // Notify listeners
      this.notifyListeners(table);
      
      return updatedItems;
    } catch (error) {
      console.error('❌ Error bulk updating items:', error);
      throw error;
    }
  }

  // Clear all data
  async clearAll(): Promise<void> {
    try {
      this.config.tables.forEach(table => {
        localStorage.setItem(table, JSON.stringify([]));
        this.notifyListeners(table);
      });
      console.log('✅ Cleared all data');
    } catch (error) {
      console.error('❌ Error clearing all data:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Statistics
  getStats(): Record<string, number> {
    if (this.useSupabase) {
      // For Supabase, use async version
      console.warn('getStats is synchronous, use getStatsAsync for Supabase');
      return {};
    }
    
    const stats: Record<string, number> = {};
    
    this.config.tables.forEach(table => {
      stats[table] = this.getAll(table).length;
    });
    
    return stats;
  }

  async getStatsAsync(): Promise<Record<string, number>> {
    if (this.useSupabase) {
      try {
        return await supabaseService.getStats();
      } catch (error) {
        console.error('Supabase getStats error, falling back to localStorage:', error);
        // Fall back to localStorage
      }
    }
    
    return this.getStats();
  }

  // Health check
  isHealthy(): boolean {
    if (this.useSupabase) {
      return supabaseService.isHealthy();
    }
    return this.initialized && typeof Storage !== 'undefined';
  }

  // Export all data for backup
  exportAll(): string {
    const backup = {
      metadata: JSON.parse(localStorage.getItem('db_metadata') || '{}'),
      data: {} as Record<string, any[]>
    };
    
    this.config.tables.forEach(table => {
      backup.data[table] = this.getAll(table);
    });
    
    return JSON.stringify(backup, null, 2);
  }

  // Import all data from backup
  async importAll(backupData: string): Promise<void> {
    try {
      const backup = JSON.parse(backupData);
      
      // Restore metadata
      localStorage.setItem('db_metadata', JSON.stringify(backup.metadata));
      
      // Restore data
      Object.entries(backup.data).forEach(([table, data]) => {
        localStorage.setItem(table, JSON.stringify(data));
        this.notifyListeners(table);
      });
      
      console.log('✅ Imported all data successfully');
    } catch (error) {
      console.error('❌ Error importing data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();