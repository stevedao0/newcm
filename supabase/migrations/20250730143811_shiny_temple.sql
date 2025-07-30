/*
  # Create Contract Management Database Schema

  1. New Tables
    - `contracts` - Stores contract information
    - `works` - Stores work/composition information  
    - `partners` - Stores partner/company information
    - `channels` - Stores distribution channel information
    - `users` - Stores user accounts

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Admin users have full access
    - Regular users have read access to their assigned data

  3. Indexes
    - Add indexes for frequently queried columns
    - Optimize search and filtering performance
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  stt integer NOT NULL,
  linh_vuc text NOT NULL DEFAULT 'Sao chép trực tuyến',
  ngay_ky text NOT NULL,
  so_hop_dong text NOT NULL,
  so_phu_luc text,
  ten_don_vi text NOT NULL,
  dia_chi text NOT NULL,
  id_kenh text NOT NULL,
  ten_kenh text NOT NULL,
  nguoi_phu_trach text NOT NULL,
  tinh_trang text NOT NULL DEFAULT 'Đã ký',
  id_video text,
  code text NOT NULL,
  ten_tac_pham text NOT NULL,
  tac_gia text NOT NULL,
  tac_gia_nhac text,
  tac_gia_loi text,
  ngay_bat_dau text NOT NULL,
  ngay_ket_thuc text NOT NULL,
  thoi_gian text,
  thoi_luong text,
  hinh_thuc text NOT NULL,
  muc_nhuan_but text NOT NULL DEFAULT '0',
  ghi_chu_1 text,
  ghi_chu_2 text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create works table
CREATE TABLE IF NOT EXISTS works (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  so_hop_dong text NOT NULL,
  so_phu_luc text,
  id_kenh text NOT NULL,
  ten_kenh text NOT NULL,
  ten_tac_pham text NOT NULL,
  tac_gia text NOT NULL,
  tac_gia_nhac text,
  tac_gia_loi text,
  ngay_bat_dau text NOT NULL,
  ngay_ket_thuc text NOT NULL,
  thoi_luong text,
  hinh_thuc text NOT NULL,
  muc_nhuan_but text NOT NULL DEFAULT '0',
  tinh_trang text NOT NULL DEFAULT 'Đã ký',
  total_contracts integer DEFAULT 1,
  total_revenue bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ten_don_vi text UNIQUE NOT NULL,
  dia_chi text NOT NULL,
  nguoi_dai_dien text,
  so_dien_thoai text,
  email text,
  website text,
  so_hop_dong_da_ky integer DEFAULT 0,
  tong_doanh_thu bigint DEFAULT 0,
  ghi_chu text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_kenh text UNIQUE NOT NULL,
  ten_kenh text NOT NULL,
  platform text NOT NULL DEFAULT 'YouTube',
  subscribers bigint DEFAULT 0,
  views bigint DEFAULT 0,
  nguoi_phu_trach text NOT NULL,
  ngay_tao text NOT NULL,
  trang_thai text NOT NULL DEFAULT 'Hoạt động',
  ghi_chu text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'active',
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_so_hop_dong ON contracts(so_hop_dong);
CREATE INDEX IF NOT EXISTS idx_contracts_id_kenh ON contracts(id_kenh);
CREATE INDEX IF NOT EXISTS idx_contracts_nguoi_phu_trach ON contracts(nguoi_phu_trach);
CREATE INDEX IF NOT EXISTS idx_contracts_tinh_trang ON contracts(tinh_trang);
CREATE INDEX IF NOT EXISTS idx_contracts_ngay_ky ON contracts(ngay_ky);

CREATE INDEX IF NOT EXISTS idx_works_code ON works(code);
CREATE INDEX IF NOT EXISTS idx_works_ten_tac_pham ON works(ten_tac_pham);
CREATE INDEX IF NOT EXISTS idx_works_tac_gia ON works(tac_gia);

CREATE INDEX IF NOT EXISTS idx_partners_ten_don_vi ON partners(ten_don_vi);
CREATE INDEX IF NOT EXISTS idx_channels_id_kenh ON channels(id_kenh);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable Row Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for contracts
CREATE POLICY "Users can read contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage contracts"
  ON contracts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Managers can manage contracts"
  ON contracts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'manager')
    )
  );

-- Create policies for works
CREATE POLICY "Users can read works"
  ON works
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage works"
  ON works
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policies for partners
CREATE POLICY "Users can read partners"
  ON partners
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage partners"
  ON partners
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policies for channels
CREATE POLICY "Users can read channels"
  ON channels
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage channels"
  ON channels
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policies for users
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_works_updated_at
  BEFORE UPDATE ON works
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();