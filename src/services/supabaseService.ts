import { supabase } from '../lib/supabase';
import { Contract, Work, Partner, Channel, User } from '../types/contract';

// Helper function to convert camelCase to snake_case
const toSnakeCase = (obj: any): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  
  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    converted[snakeKey] = toSnakeCase(value);
  }
  return converted;
};

// Helper function to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    converted[camelKey] = toCamelCase(value);
  }
  return converted;
};

class SupabaseService {
  // Contracts
  async getContracts(): Promise<Contract[]> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data ? data.map(toCamelCase) : [];
    } catch (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }
  }

  async createContract(contract: Omit<Contract, 'id'>): Promise<Contract> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .insert([toSnakeCase(contract)])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .update(toSnakeCase(updates))
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error updating contract:', error);
      throw error;
    }
  }

  async deleteContract(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting contract:', error);
      throw error;
    }
  }

  async bulkCreateContracts(contracts: Omit<Contract, 'id'>[]): Promise<Contract[]> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .insert(contracts.map(toSnakeCase))
        .select();
      
      if (error) throw error;
      return data ? data.map(toCamelCase) : [];
    } catch (error) {
      console.error('Error bulk creating contracts:', error);
      throw error;
    }
  }

  // Works
  async getWorks(): Promise<Work[]> {
    try {
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data ? data.map(toCamelCase) : [];
    } catch (error) {
      console.error('Error fetching works:', error);
      throw error;
    }
  }

  async createWork(work: Omit<Work, 'id'>): Promise<Work> {
    try {
      const { data, error } = await supabase
        .from('works')
        .insert([toSnakeCase(work)])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating work:', error);
      throw error;
    }
  }

  async updateWork(id: string, updates: Partial<Work>): Promise<Work> {
    try {
      const { data, error } = await supabase
        .from('works')
        .update(toSnakeCase(updates))
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error updating work:', error);
      throw error;
    }
  }

  async deleteWork(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('works')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting work:', error);
      throw error;
    }
  }

  async bulkCreateWorks(works: Omit<Work, 'id'>[]): Promise<Work[]> {
    try {
      const { data, error } = await supabase
        .from('works')
        .insert(works.map(toSnakeCase))
        .select();
      
      if (error) throw error;
      return data ? data.map(toCamelCase) : [];
    } catch (error) {
      console.error('Error bulk creating works:', error);
      throw error;
    }
  }

  // Partners
  async getPartners(): Promise<Partner[]> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data ? data.map(toCamelCase) : [];
    } catch (error) {
      console.error('Error fetching partners:', error);
      throw error;
    }
  }

  async createPartner(partner: Omit<Partner, 'id'>): Promise<Partner> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .insert([toSnakeCase(partner)])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating partner:', error);
      throw error;
    }
  }

  async updatePartner(id: string, updates: Partial<Partner>): Promise<Partner> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .update(toSnakeCase(updates))
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error updating partner:', error);
      throw error;
    }
  }

  async deletePartner(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting partner:', error);
      throw error;
    }
  }

  async bulkCreatePartners(partners: Omit<Partner, 'id'>[]): Promise<Partner[]> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .insert(partners.map(toSnakeCase))
        .select();
      
      if (error) throw error;
      return data ? data.map(toCamelCase) : [];
    } catch (error) {
      console.error('Error bulk creating partners:', error);
      throw error;
    }
  }

  // Channels
  async getChannels(): Promise<Channel[]> {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data ? data.map(toCamelCase) : [];
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw error;
    }
  }

  async createChannel(channel: Omit<Channel, 'id'>): Promise<Channel> {
    try {
      const { data, error } = await supabase
        .from('channels')
        .insert([toSnakeCase(channel)])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  }

  async updateChannel(id: string, updates: Partial<Channel>): Promise<Channel> {
    try {
      const { data, error } = await supabase
        .from('channels')
        .update(toSnakeCase(updates))
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  }

  async deleteChannel(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting channel:', error);
      throw error;
    }
  }

  async bulkCreateChannels(channels: Omit<Channel, 'id'>[]): Promise<Channel[]> {
    try {
      const { data, error } = await supabase
        .from('channels')
        .insert(channels.map(toSnakeCase))
        .select();
      
      if (error) throw error;
      return data ? data.map(toCamelCase) : [];
    } catch (error) {
      console.error('Error bulk creating channels:', error);
      throw error;
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data ? data.map(toCamelCase) : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([toSnakeCase(user)])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(toSnakeCase(updates))
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Generic methods for compatibility with existing database service
  async getAll(table: string): Promise<any[]> {
    switch (table) {
      case 'contracts':
        return this.getContracts();
      case 'works':
        return this.getWorks();
      case 'partners':
        return this.getPartners();
      case 'channels':
        return this.getChannels();
      case 'users':
        return this.getUsers();
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  async create(table: string, data: any): Promise<any> {
    switch (table) {
      case 'contracts':
        return this.createContract(data);
      case 'works':
        return this.createWork(data);
      case 'partners':
        return this.createPartner(data);
      case 'channels':
        return this.createChannel(data);
      case 'users':
        return this.createUser(data);
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  async update(table: string, id: string, data: any): Promise<any> {
    switch (table) {
      case 'contracts':
        return this.updateContract(id, data);
      case 'works':
        return this.updateWork(id, data);
      case 'partners':
        return this.updatePartner(id, data);
      case 'channels':
        return this.updateChannel(id, data);
      case 'users':
        return this.updateUser(id, data);
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  async delete(table: string, id: string): Promise<void> {
    switch (table) {
      case 'contracts':
        return this.deleteContract(id);
      case 'works':
        return this.deleteWork(id);
      case 'partners':
        return this.deletePartner(id);
      case 'channels':
        return this.deleteChannel(id);
      case 'users':
        return this.deleteUser(id);
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  async bulkCreate(table: string, items: any[]): Promise<any[]> {
    switch (table) {
      case 'contracts':
        return this.bulkCreateContracts(items);
      case 'works':
        return this.bulkCreateWorks(items);
      case 'partners':
        return this.bulkCreatePartners(items);
      case 'channels':
        return this.bulkCreateChannels(items);
      default:
        throw new Error(`Bulk create not supported for table: ${table}`);
    }
  }

  // Subscription method for compatibility
  subscribe(table: string, callback: () => void) {
    const channel = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: table 
        }, 
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Health check
  isHealthy(): boolean {
    return !!supabase;
  }

  // Statistics
  async getStats(): Promise<Record<string, number>> {
    try {
      const [contracts, works, partners, channels, users] = await Promise.all([
        this.getContracts(),
        this.getWorks(),
        this.getPartners(),
        this.getChannels(),
        this.getUsers()
      ]);

      return {
        contracts: contracts.length,
        works: works.length,
        partners: partners.length,
        channels: channels.length,
        users: users.length
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        contracts: 0,
        works: 0,
        partners: 0,
        channels: 0,
        users: 0
      };
    }
  }

  // Migration helper - move data from localStorage to Supabase
  async migrateFromLocalStorage(): Promise<void> {
    try {
      console.log('🔄 Starting migration from localStorage to Supabase...');
      
      // Get data from localStorage
      const localContracts = JSON.parse(localStorage.getItem('contracts') || '[]');
      const localWorks = JSON.parse(localStorage.getItem('works') || '[]');
      const localPartners = JSON.parse(localStorage.getItem('partners') || '[]');
      const localChannels = JSON.parse(localStorage.getItem('channels') || '[]');
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');

      // Migrate contracts
      if (localContracts.length > 0) {
        console.log(`📄 Migrating ${localContracts.length} contracts...`);
        await this.bulkCreateContracts(localContracts);
      }

      // Migrate works
      if (localWorks.length > 0) {
        console.log(`🎵 Migrating ${localWorks.length} works...`);
        await this.bulkCreateWorks(localWorks);
      }

      // Migrate partners
      if (localPartners.length > 0) {
        console.log(`🏢 Migrating ${localPartners.length} partners...`);
        await this.bulkCreatePartners(localPartners);
      }

      // Migrate channels
      if (localChannels.length > 0) {
        console.log(`📺 Migrating ${localChannels.length} channels...`);
        await this.bulkCreateChannels(localChannels);
      }

      // Migrate users
      if (localUsers.length > 0) {
        console.log(`👥 Migrating ${localUsers.length} users...`);
        for (const user of localUsers) {
          try {
            await this.createUser(user);
          } catch (error) {
            console.warn('User migration error (might already exist):', error);
          }
        }
      }

      console.log('✅ Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService();