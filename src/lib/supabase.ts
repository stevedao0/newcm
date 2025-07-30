import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      contracts: {
        Row: {
          id: string
          stt: number
          linh_vuc: string
          ngay_ky: string
          so_hop_dong: string
          so_phu_luc: string | null
          ten_don_vi: string
          dia_chi: string
          id_kenh: string
          ten_kenh: string
          nguoi_phu_trach: string
          tinh_trang: string
          id_video: string | null
          code: string
          ten_tac_pham: string
          tac_gia: string
          tac_gia_nhac: string | null
          tac_gia_loi: string | null
          ngay_bat_dau: string
          ngay_ket_thuc: string
          thoi_gian: string | null
          thoi_luong: string | null
          hinh_thuc: string
          muc_nhuan_but: string
          ghi_chu_1: string | null
          ghi_chu_2: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          stt: number
          linh_vuc: string
          ngay_ky: string
          so_hop_dong: string
          so_phu_luc?: string | null
          ten_don_vi: string
          dia_chi: string
          id_kenh: string
          ten_kenh: string
          nguoi_phu_trach: string
          tinh_trang: string
          id_video?: string | null
          code: string
          ten_tac_pham: string
          tac_gia: string
          tac_gia_nhac?: string | null
          tac_gia_loi?: string | null
          ngay_bat_dau: string
          ngay_ket_thuc: string
          thoi_gian?: string | null
          thoi_luong?: string | null
          hinh_thuc: string
          muc_nhuan_but: string
          ghi_chu_1?: string | null
          ghi_chu_2?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          stt?: number
          linh_vuc?: string
          ngay_ky?: string
          so_hop_dong?: string
          so_phu_luc?: string | null
          ten_don_vi?: string
          dia_chi?: string
          id_kenh?: string
          ten_kenh?: string
          nguoi_phu_trach?: string
          tinh_trang?: string
          id_video?: string | null
          code?: string
          ten_tac_pham?: string
          tac_gia?: string
          tac_gia_nhac?: string | null
          tac_gia_loi?: string | null
          ngay_bat_dau?: string
          ngay_ket_thuc?: string
          thoi_gian?: string | null
          thoi_luong?: string | null
          hinh_thuc?: string
          muc_nhuan_but?: string
          ghi_chu_1?: string | null
          ghi_chu_2?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      works: {
        Row: {
          id: string
          code: string
          so_hop_dong: string
          so_phu_luc: string | null
          id_kenh: string
          ten_kenh: string
          ten_tac_pham: string
          tac_gia: string
          tac_gia_nhac: string | null
          tac_gia_loi: string | null
          ngay_bat_dau: string
          ngay_ket_thuc: string
          thoi_luong: string | null
          hinh_thuc: string
          muc_nhuan_but: string
          tinh_trang: string
          total_contracts: number
          total_revenue: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          so_hop_dong: string
          so_phu_luc?: string | null
          id_kenh: string
          ten_kenh: string
          ten_tac_pham: string
          tac_gia: string
          tac_gia_nhac?: string | null
          tac_gia_loi?: string | null
          ngay_bat_dau: string
          ngay_ket_thuc: string
          thoi_luong?: string | null
          hinh_thuc: string
          muc_nhuan_but: string
          tinh_trang: string
          total_contracts?: number
          total_revenue?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          so_hop_dong?: string
          so_phu_luc?: string | null
          id_kenh?: string
          ten_kenh?: string
          ten_tac_pham?: string
          tac_gia?: string
          tac_gia_nhac?: string | null
          tac_gia_loi?: string | null
          ngay_bat_dau?: string
          ngay_ket_thuc?: string
          thoi_luong?: string | null
          hinh_thuc?: string
          muc_nhuan_but?: string
          tinh_trang?: string
          total_contracts?: number
          total_revenue?: number
          created_at?: string
          updated_at?: string
        }
      }
      partners: {
        Row: {
          id: string
          ten_don_vi: string
          dia_chi: string
          nguoi_dai_dien: string | null
          so_dien_thoai: string | null
          email: string | null
          website: string | null
          so_hop_dong_da_ky: number
          tong_doanh_thu: number
          ghi_chu: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ten_don_vi: string
          dia_chi: string
          nguoi_dai_dien?: string | null
          so_dien_thoai?: string | null
          email?: string | null
          website?: string | null
          so_hop_dong_da_ky?: number
          tong_doanh_thu?: number
          ghi_chu?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ten_don_vi?: string
          dia_chi?: string
          nguoi_dai_dien?: string | null
          so_dien_thoai?: string | null
          email?: string | null
          website?: string | null
          so_hop_dong_da_ky?: number
          tong_doanh_thu?: number
          ghi_chu?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          id_kenh: string
          ten_kenh: string
          platform: string
          subscribers: number | null
          views: number | null
          nguoi_phu_trach: string
          ngay_tao: string
          trang_thai: string
          ghi_chu: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          id_kenh: string
          ten_kenh: string
          platform: string
          subscribers?: number | null
          views?: number | null
          nguoi_phu_trach: string
          ngay_tao: string
          trang_thai: string
          ghi_chu?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          id_kenh?: string
          ten_kenh?: string
          platform?: string
          subscribers?: number | null
          views?: number | null
          nguoi_phu_trach?: string
          ngay_tao?: string
          trang_thai?: string
          ghi_chu?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          username: string
          full_name: string
          email: string
          role: string
          status: string
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          full_name: string
          email: string
          role: string
          status?: string
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string
          email?: string
          role?: string
          status?: string
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}