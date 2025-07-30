import Database from 'better-sqlite3';
import { Contract, Work, Partner, Channel, User } from '../types/contract';

class SQLiteService {
  private db: Database.Database;
  private initialized: boolean = false;

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase() {
    try {
      // Create SQLite database file
      this.db = new Database('contract_management.db');
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Create tables
      this.createTables();
      
      this.initialized = true;
      console.log('✅ SQLite database initialized successfully');
    } catch (error) {
      console.error('❌ SQLite initialization error:', error);
      this.initialized = false;
    }
  }

  private createTables() {
    // Create contracts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        stt INTEGER NOT NULL,
        linhVuc TEXT NOT NULL DEFAULT 'Sao chép trực tuyến',
        ngayKy TEXT NOT NULL,
        soHopDong TEXT NOT NULL,
        soPhuLuc TEXT,
        tenDonVi TEXT NOT NULL,
        diaChi TEXT NOT NULL,
        idKenh TEXT NOT NULL,
        tenKenh TEXT NOT NULL,
        nguoiPhuTrach TEXT NOT NULL,
        tinhTrang TEXT NOT NULL DEFAULT 'Đã ký',
        idVideo TEXT,
        code TEXT NOT NULL,
        tenTacPham TEXT NOT NULL,
        tacGia TEXT NOT NULL,
        tacGiaNhac TEXT,
        tacGiaLoi TEXT,
        ngayBatDau TEXT NOT NULL,
        ngayKetThuc TEXT NOT NULL,
        thoiGian TEXT,
        thoiLuong TEXT,
        hinhThuc TEXT NOT NULL,
        mucNhuanBut TEXT NOT NULL DEFAULT '0',
        ghiChu1 TEXT,
        ghiChu2 TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create works table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS works (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        soHopDong TEXT NOT NULL,
        soPhuLuc TEXT,
        idKenh TEXT NOT NULL,
        tenKenh TEXT NOT NULL,
        tenTacPham TEXT NOT NULL,
        tacGia TEXT NOT NULL,
        tacGiaNhac TEXT,
        tacGiaLoi TEXT,
        ngayBatDau TEXT NOT NULL,
        ngayKetThuc TEXT NOT NULL,
        thoiLuong TEXT,
        hinhThuc TEXT NOT NULL,
        mucNhuanBut TEXT NOT NULL DEFAULT '0',
        tinhTrang TEXT NOT NULL DEFAULT 'Đã ký',
        totalContracts INTEGER DEFAULT 1,
        totalRevenue INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create partners table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS partners (
        id TEXT PRIMARY KEY,
        tenDonVi TEXT UNIQUE NOT NULL,
        diaChi TEXT NOT NULL,
        nguoiDaiDien TEXT,
        soDienThoai TEXT,
        email TEXT,
        website TEXT,
        soHopDongDaKy INTEGER DEFAULT 0,
        tongDoanhThu INTEGER DEFAULT 0,
        ghiChu TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create channels table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        idKenh TEXT UNIQUE NOT NULL,
        tenKenh TEXT NOT NULL,
        platform TEXT NOT NULL DEFAULT 'YouTube',
        subscribers INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        nguoiPhuTrach TEXT NOT NULL,
        ngayTao TEXT NOT NULL,
        trangThai TEXT NOT NULL DEFAULT 'Hoạt động',
        ghiChu TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        status TEXT NOT NULL DEFAULT 'active',
        lastLogin TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_contracts_soHopDong ON contracts(soHopDong);
      CREATE INDEX IF NOT EXISTS idx_contracts_idKenh ON contracts(idKenh);
      CREATE INDEX IF NOT EXISTS idx_contracts_nguoiPhuTrach ON contracts(nguoiPhuTrach);
      CREATE INDEX IF NOT EXISTS idx_works_code ON works(code);
      CREATE INDEX IF NOT EXISTS idx_partners_tenDonVi ON partners(tenDonVi);
      CREATE INDEX IF NOT EXISTS idx_channels_idKenh ON channels(idKenh);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
  }

  // Contracts CRUD
  async getContracts(): Promise<Contract[]> {
    try {
      const stmt = this.db.prepare('SELECT * FROM contracts ORDER BY createdAt DESC');
      return stmt.all() as Contract[];
    } catch (error) {
      console.error('Error fetching contracts:', error);
      return [];
    }
  }

  async createContract(contract: Omit<Contract, 'id'>): Promise<Contract> {
    try {
      const id = this.generateId();
      const stmt = this.db.prepare(`
        INSERT INTO contracts (
          id, stt, linhVuc, ngayKy, soHopDong, soPhuLuc, tenDonVi, diaChi,
          idKenh, tenKenh, nguoiPhuTrach, tinhTrang, idVideo, code,
          tenTacPham, tacGia, tacGiaNhac, tacGiaLoi, ngayBatDau, ngayKetThuc,
          thoiGian, thoiLuong, hinhThuc, mucNhuanBut, ghiChu1, ghiChu2
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id, contract.stt, contract.linhVuc, contract.ngayKy, contract.soHopDong,
        contract.soPhuLuc, contract.tenDonVi, contract.diaChi, contract.idKenh,
        contract.tenKenh, contract.nguoiPhuTrach, contract.tinhTrang, contract.idVideo,
        contract.code, contract.tenTacPham, contract.tacGia, contract.tacGiaNhac,
        contract.tacGiaLoi, contract.ngayBatDau, contract.ngayKetThuc, contract.thoiGian,
        contract.thoiLuong, contract.hinhThuc, contract.mucNhuanBut, contract.ghiChu1,
        contract.ghiChu2
      );
      
      return { ...contract, id };
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract> {
    try {
      const fields = Object.keys(updates).filter(key => key !== 'id');
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updates[field as keyof Contract]);
      
      const stmt = this.db.prepare(`
        UPDATE contracts 
        SET ${setClause}, updatedAt = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      
      stmt.run(...values, id);
      
      // Return updated contract
      const getStmt = this.db.prepare('SELECT * FROM contracts WHERE id = ?');
      return getStmt.get(id) as Contract;
    } catch (error) {
      console.error('Error updating contract:', error);
      throw error;
    }
  }

  async deleteContract(id: string): Promise<void> {
    try {
      const stmt = this.db.prepare('DELETE FROM contracts WHERE id = ?');
      stmt.run(id);
    } catch (error) {
      console.error('Error deleting contract:', error);
      throw error;
    }
  }

  async bulkCreateContracts(contracts: Omit<Contract, 'id'>[]): Promise<Contract[]> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO contracts (
          id, stt, linhVuc, ngayKy, soHopDong, soPhuLuc, tenDonVi, diaChi,
          idKenh, tenKenh, nguoiPhuTrach, tinhTrang, idVideo, code,
          tenTacPham, tacGia, tacGiaNhac, tacGiaLoi, ngayBatDau, ngayKetThuc,
          thoiGian, thoiLuong, hinhThuc, mucNhuanBut, ghiChu1, ghiChu2
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const transaction = this.db.transaction((contracts: Omit<Contract, 'id'>[]) => {
        const results = [];
        for (const contract of contracts) {
          const id = this.generateId();
          stmt.run(
            id, contract.stt, contract.linhVuc, contract.ngayKy, contract.soHopDong,
            contract.soPhuLuc, contract.tenDonVi, contract.diaChi, contract.idKenh,
            contract.tenKenh, contract.nguoiPhuTrach, contract.tinhTrang, contract.idVideo,
            contract.code, contract.tenTacPham, contract.tacGia, contract.tacGiaNhac,
            contract.tacGiaLoi, contract.ngayBatDau, contract.ngayKetThuc, contract.thoiGian,
            contract.thoiLuong, contract.hinhThuc, contract.mucNhuanBut, contract.ghiChu1,
            contract.ghiChu2
          );
          results.push({ ...contract, id });
        }
        return results;
      });
      
      return transaction(contracts);
    } catch (error) {
      console.error('Error bulk creating contracts:', error);
      throw error;
    }
  }

  // Works CRUD (similar pattern)
  async getWorks(): Promise<Work[]> {
    try {
      const stmt = this.db.prepare('SELECT * FROM works ORDER BY createdAt DESC');
      return stmt.all() as Work[];
    } catch (error) {
      console.error('Error fetching works:', error);
      return [];
    }
  }

  async createWork(work: Omit<Work, 'id'>): Promise<Work> {
    try {
      const id = this.generateId();
      const stmt = this.db.prepare(`
        INSERT INTO works (
          id, code, soHopDong, soPhuLuc, idKenh, tenKenh, tenTacPham,
          tacGia, tacGiaNhac, tacGiaLoi, ngayBatDau, ngayKetThuc, thoiLuong,
          hinhThuc, mucNhuanBut, tinhTrang, totalContracts, totalRevenue
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id, work.code, work.soHopDong, work.soPhuLuc, work.idKenh,
        work.tenKenh, work.tenTacPham, work.tacGia, work.tacGiaNhac,
        work.tacGiaLoi, work.ngayBatDau, work.ngayKetThuc, work.thoiLuong,
        work.hinhThuc, work.mucNhuanBut, work.tinhTrang, work.totalContracts,
        work.totalRevenue
      );
      
      return { ...work, id };
    } catch (error) {
      console.error('Error creating work:', error);
      throw error;
    }
  }

  // Partners CRUD
  async getPartners(): Promise<Partner[]> {
    try {
      const stmt = this.db.prepare('SELECT * FROM partners ORDER BY createdAt DESC');
      return stmt.all() as Partner[];
    } catch (error) {
      console.error('Error fetching partners:', error);
      return [];
    }
  }

  async createPartner(partner: Omit<Partner, 'id'>): Promise<Partner> {
    try {
      const id = this.generateId();
      const stmt = this.db.prepare(`
        INSERT INTO partners (
          id, tenDonVi, diaChi, nguoiDaiDien, soDienThoai, email,
          website, soHopDongDaKy, tongDoanhThu, ghiChu
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id, partner.tenDonVi, partner.diaChi, partner.nguoiDaiDien,
        partner.soDienThoai, partner.email, partner.website,
        partner.soHopDongDaKy, partner.tongDoanhThu, partner.ghiChu
      );
      
      return { ...partner, id };
    } catch (error) {
      console.error('Error creating partner:', error);
      throw error;
    }
  }

  // Channels CRUD
  async getChannels(): Promise<Channel[]> {
    try {
      const stmt = this.db.prepare('SELECT * FROM channels ORDER BY createdAt DESC');
      return stmt.all() as Channel[];
    } catch (error) {
      console.error('Error fetching channels:', error);
      return [];
    }
  }

  async createChannel(channel: Omit<Channel, 'id'>): Promise<Channel> {
    try {
      const id = this.generateId();
      const stmt = this.db.prepare(`
        INSERT INTO channels (
          id, idKenh, tenKenh, platform, subscribers, views,
          nguoiPhuTrach, ngayTao, trangThai, ghiChu
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id, channel.idKenh, channel.tenKenh, channel.platform,
        channel.subscribers, channel.views, channel.nguoiPhuTrach,
        channel.ngayTao, channel.trangThai, channel.ghiChu
      );
      
      return { ...channel, id };
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  }

  // Users CRUD
  async getUsers(): Promise<User[]> {
    try {
      const stmt = this.db.prepare('SELECT * FROM users ORDER BY createdAt DESC');
      return stmt.all() as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    try {
      const id = this.generateId();
      const stmt = this.db.prepare(`
        INSERT INTO users (
          id, username, fullName, email, role, status, lastLogin
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id, user.username, user.fullName, user.email,
        user.role, user.status, user.lastLogin
      );
      
      return { ...user, id };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Generic methods for compatibility
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
        return [];
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

  async bulkCreate(table: string, items: any[]): Promise<any[]> {
    switch (table) {
      case 'contracts':
        return this.bulkCreateContracts(items);
      default:
        // For other tables, create one by one
        const results = [];
        for (const item of items) {
          results.push(await this.create(table, item));
        }
        return results;
    }
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Statistics
  getStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    try {
      const tables = ['contracts', 'works', 'partners', 'channels', 'users'];
      tables.forEach(table => {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
        const result = stmt.get() as { count: number };
        stats[table] = result.count;
      });
    } catch (error) {
      console.error('Error getting stats:', error);
    }
    
    return stats;
  }

  // Health check
  isHealthy(): boolean {
    return this.initialized && this.db !== null;
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
    }
  }

  // Backup database
  backup(filePath: string): void {
    try {
      this.db.backup(filePath);
      console.log(`✅ Database backed up to ${filePath}`);
    } catch (error) {
      console.error('❌ Backup error:', error);
      throw error;
    }
  }

  // Migration from localStorage
  async migrateFromLocalStorage(): Promise<void> {
    try {
      console.log('🔄 Starting migration from localStorage to SQLite...');
      
      // Get data from localStorage
      const localContracts = JSON.parse(localStorage.getItem('contracts') || '[]');
      const localWorks = JSON.parse(localStorage.getItem('works') || '[]');
      const localPartners = JSON.parse(localStorage.getItem('partners') || '[]');
      const localChannels = JSON.parse(localStorage.getItem('channels') || '[]');
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');

      // Migrate data
      if (localContracts.length > 0) {
        console.log(`📄 Migrating ${localContracts.length} contracts...`);
        await this.bulkCreateContracts(localContracts);
      }

      if (localWorks.length > 0) {
        console.log(`🎵 Migrating ${localWorks.length} works...`);
        for (const work of localWorks) {
          await this.createWork(work);
        }
      }

      if (localPartners.length > 0) {
        console.log(`🏢 Migrating ${localPartners.length} partners...`);
        for (const partner of localPartners) {
          await this.createPartner(partner);
        }
      }

      if (localChannels.length > 0) {
        console.log(`📺 Migrating ${localChannels.length} channels...`);
        for (const channel of localChannels) {
          await this.createChannel(channel);
        }
      }

      if (localUsers.length > 0) {
        console.log(`👥 Migrating ${localUsers.length} users...`);
        for (const user of localUsers) {
          await this.createUser(user);
        }
      }

      console.log('✅ Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}

export const sqliteService = new SQLiteService();