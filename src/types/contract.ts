export interface Contract {
  id: string;
  stt: number;
  linhVuc: string;
  ngayKy: string;
  soHopDong: string;
  soPhuLuc?: string;
  idKenh: string;
  tenKenh: string;
  tenDonVi: string;
  diaChi: string;
  nguoiPhuTrach: string;
  tinhTrang: 'Đã ký' | 'Tái ký' | 'Khảo sát' | 'Đàm phán' | 'Ký mới';
  idVideo?: string;
  code: string;
  tenTacPham: string;
  tacGia: string;
  tacGiaNhac?: string;
  tacGiaLoi?: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  thoiGian?: string;
  thoiLuong?: string;
  hinhThuc: string;
  mucNhuanBut: string;
  ghiChu1?: string;
  ghiChu2?: string;
  nhatKy?: ContractLog[];
}

export interface ContractLog {
  id: string;
  date: string;
  action: string;
  user: string;
  details: string;
}

export interface Company {
  id: string;
  stt: number;
  linhVuc: string;
  ngayKy: string;
  soHopDong: string;
  soPhuLuc?: string;
  tenDonVi: string;
  diaChi: string;
  idKenh: string;
  tenKenh: string;
  mucNhuanBut: string;
  nguoiPhuTrach: string;
  tinhTrang: 'Đã ký' | 'Tái ký' | 'Khảo sát' | 'Đàm phán' | 'Ký mới';
}

export interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

export interface Partner {
  id: string;
  tenDonVi: string;
  diaChi: string;
  nguoiDaiDien?: string;
  soDienThoai?: string;
  email?: string;
  website?: string;
  soHopDongDaKy: number;
  tongDoanhThu: number;
  ghiChu?: string;
}

export interface Channel {
  id: string;
  idKenh: string;
  tenKenh: string;
  platform: 'YouTube' | 'Facebook' | 'TikTok' | 'Khác';
  subscribers?: number;
  views?: number;
  nguoiPhuTrach: string;
  ngayTao: string;
  trangThai: 'Hoạt động' | 'Tạm ngưng' | 'Đã xóa';
  ghiChu?: string;
}

export interface Work {
  id: string;
  code: string;
  soHopDong: string;
  soPhuLuc?: string;
  idKenh: string;
  tenKenh: string;
  tenTacPham: string;
  tacGia: string;
  tacGiaNhac?: string;
  tacGiaLoi?: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  thoiLuong?: string;
  hinhThuc: string;
  mucNhuanBut: string;
  tinhTrang: 'Đã ký' | 'Tái ký' | 'Khảo sát' | 'Đàm phán' | 'Ký mới';
  totalContracts: number;
  totalRevenue: number;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  avatar?: string;
  lastLogin?: string;
  status: 'active' | 'inactive';
}

export interface ImportResult {
  success: boolean;
  message: string;
  totalRecords?: number;
  newRecords?: number;
  updatedRecords?: number;
  errors?: string[];
}

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  period: 'day' | 'week' | 'month' | 'year';
  type: 'contracts' | 'revenue' | 'works';
  linhVuc?: string;
  tinhTrang?: string;
  nguoiPhuTrach?: string;
}

export interface ReportData {
  label: string;
  contracts: number;
  revenue: number;
  works: number;
}