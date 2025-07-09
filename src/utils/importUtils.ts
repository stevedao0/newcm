import { Contract, ImportResult, Partner, Channel, Work } from '../types/contract';
import { v4 as uuidv4 } from 'uuid';

// Helper function to parse CSV data into Contract objects
export const parseInfoData = (data: any[], existingContracts: Contract[]): ImportResult => {
  try {
    const newContracts: Contract[] = [];
    const updatedContracts: Contract[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      try {
        // Check if required fields are present
        if (!row.STT || !row['Lĩnh vực'] || !row['Ngày ký'] || !row['Số hợp đồng'] || 
            !row['Tên đơn vị'] || !row['Địa chỉ'] || !row['ID Kênh'] || !row['Tên kênh'] || 
            !row['Mức nhuận bút'] || !row['Người phụ trách'] || !row['Tình trạng']) {
          errors.push(`Dòng ${index + 2}: Thiếu thông tin bắt buộc`);
          return;
        }

        // Check if contract already exists
        const existingContract = existingContracts.find(
          c => c.soHopDong === row['Số hợp đồng'] && c.soPhuLuc === (row['Số phụ lục'] || '')
        );

        const contract: Contract = {
          id: existingContract?.id || uuidv4(),
          stt: parseInt(row.STT) || 0,
          linhVuc: row['Lĩnh vực'],
          ngayKy: row['Ngày ký'],
          soHopDong: row['Số hợp đồng'],
          soPhuLuc: row['Số phụ lục'] || '',
          tenDonVi: row['Tên đơn vị'],
          diaChi: row['Địa chỉ'],
          idKenh: row['ID Kênh'],
          tenKenh: row['Tên kênh'],
          mucNhuanBut: row['Mức nhuận bút'],
          nguoiPhuTrach: row['Người phụ trách'],
          tinhTrang: row['Tình trạng'] as any,
          // Default values for required fields that might not be in Info.csv
          code: existingContract?.code || '',
          tenTacPham: existingContract?.tenTacPham || '',
          tacGia: existingContract?.tacGia || '',
          ngayBatDau: existingContract?.ngayBatDau || '',
          ngayKetThuc: existingContract?.ngayKetThuc || '',
          hinhThuc: existingContract?.hinhThuc || '',
          // Optional fields
          tacGiaNhac: existingContract?.tacGiaNhac || '',
          tacGiaLoi: existingContract?.tacGiaLoi || '',
          thoiGian: existingContract?.thoiGian || '',
          thoiLuong: existingContract?.thoiLuong || '',
          ghiChu1: existingContract?.ghiChu1 || '',
          ghiChu2: existingContract?.ghiChu2 || '',
          nhatKy: existingContract?.nhatKy || []
        };

        if (existingContract) {
          updatedContracts.push(contract);
        } else {
          newContracts.push(contract);
        }
      } catch (error) {
        errors.push(`Dòng ${index + 2}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
      }
    });

    return {
      success: true,
      message: `Import thành công ${newContracts.length} bản ghi mới và cập nhật ${updatedContracts.length} bản ghi`,
      totalRecords: newContracts.length + updatedContracts.length,
      newRecords: newContracts.length,
      updatedRecords: updatedContracts.length,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi không xác định khi xử lý dữ liệu',
      errors: [error instanceof Error ? error.message : 'Lỗi không xác định']
    };
  }
};

// Helper function to parse CSV data into Work objects
export const parseWorkListData = (data: any[], existingContracts: Contract[]): ImportResult => {
  try {
    const newContracts: Contract[] = [];
    const updatedContracts: Contract[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      try {
        // Check if required fields are present
        if (!row.STT || !row['Lĩnh vực'] || !row['Ngày ký'] || !row['Số hợp đồng'] || 
            !row['ID Kênh'] || !row['Tên kênh'] || !row['Người phụ trách'] || 
            !row['Tình trạng'] || !row.Code || !row['Tên tác phẩm'] || 
            !row['Tác giả'] || !row['Ngày bắt đầu'] || !row['Ngày kết thúc'] || 
            !row['Hình thức'] || !row['Mức nhuận bút']) {
          errors.push(`Dòng ${index + 2}: Thiếu thông tin bắt buộc`);
          return;
        }

        // Check if contract already exists
        const existingContract = existingContracts.find(
          c => c.soHopDong === row['Số hợp đồng'] && 
               c.soPhuLuc === (row['Số phụ lục'] || '') &&
               c.code === row.Code
        );

        // Find partner info from existing contracts
        const partnerInfo = existingContracts.find(
          c => c.soHopDong === row['Số hợp đồng'] && c.soPhuLuc === (row['Số phụ lục'] || '')
        );

        const contract: Contract = {
          id: existingContract?.id || uuidv4(),
          stt: parseInt(row.STT) || 0,
          linhVuc: row['Lĩnh vực'],
          ngayKy: row['Ngày ký'],
          soHopDong: row['Số hợp đồng'],
          soPhuLuc: row['Số phụ lục'] || '',
          idKenh: row['ID Kênh'],
          tenKenh: row['Tên kênh'],
          tenDonVi: partnerInfo?.tenDonVi || existingContract?.tenDonVi || '',
          diaChi: partnerInfo?.diaChi || existingContract?.diaChi || '',
          nguoiPhuTrach: row['Người phụ trách'],
          tinhTrang: row['Tình trạng'] as any,
          idVideo: row['ID Video'] || '',
          code: row.Code,
          tenTacPham: row['Tên tác phẩm'],
          tacGia: row['Tác giả'],
          tacGiaNhac: row['Tác giả nhạc'] || '',
          tacGiaLoi: row['Tác giả lời'] || '',
          ngayBatDau: row['Ngày bắt đầu'],
          ngayKetThuc: row['Ngày kết thúc'],
          thoiGian: row['Thời gian'] || '',
          thoiLuong: row['Thời lượng'] || '',
          hinhThuc: row['Hình thức'],
          mucNhuanBut: row['Mức nhuận bút'],
          ghiChu1: row['Ghi chú 1'] || '',
          ghiChu2: row['Ghi chú 2'] || '',
          nhatKy: existingContract?.nhatKy || []
        };

        if (existingContract) {
          updatedContracts.push(contract);
        } else {
          newContracts.push(contract);
        }
      } catch (error) {
        errors.push(`Dòng ${index + 2}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
      }
    });

    return {
      success: true,
      message: `Import thành công ${newContracts.length} bản ghi mới và cập nhật ${updatedContracts.length} bản ghi`,
      totalRecords: newContracts.length + updatedContracts.length,
      newRecords: newContracts.length,
      updatedRecords: updatedContracts.length,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi không xác định khi xử lý dữ liệu',
      errors: [error instanceof Error ? error.message : 'Lỗi không xác định']
    };
  }
};

// Extract partners from contracts
export const extractPartners = (contracts: Contract[]): Partner[] => {
  const partnersMap = new Map<string, Partner>();
  
  contracts.forEach(contract => {
    if (!contract.tenDonVi) return;
    
    const key = contract.tenDonVi;
    
    if (!partnersMap.has(key)) {
      partnersMap.set(key, {
        id: uuidv4(),
        tenDonVi: contract.tenDonVi,
        diaChi: contract.diaChi,
        soHopDongDaKy: 1,
        tongDoanhThu: parseInt(contract.mucNhuanBut.replace(/,/g, '')) || 0
      });
    } else {
      const partner = partnersMap.get(key)!;
      partner.soHopDongDaKy += 1;
      partner.tongDoanhThu += parseInt(contract.mucNhuanBut.replace(/,/g, '')) || 0;
    }
  });
  
  return Array.from(partnersMap.values());
};

// Extract channels from contracts
export const extractChannels = (contracts: Contract[]): Channel[] => {
  const channelsMap = new Map<string, Channel>();
  
  contracts.forEach(contract => {
    if (!contract.idKenh || !contract.tenKenh) return;
    
    const key = contract.idKenh;
    
    if (!channelsMap.has(key)) {
      channelsMap.set(key, {
        id: uuidv4(),
        idKenh: contract.idKenh,
        tenKenh: contract.tenKenh,
        platform: 'YouTube', // Default
        nguoiPhuTrach: contract.nguoiPhuTrach,
        ngayTao: contract.ngayKy, // Use contract date as fallback
        trangThai: 'Hoạt động'
      });
    }
  });
  
  return Array.from(channelsMap.values());
};

// Extract works from contracts
export const extractWorks = (contracts: Contract[]): Work[] => {
  const worksMap = new Map<string, Work>();
  
  contracts.forEach(contract => {
    if (!contract.code || !contract.tenTacPham) return;
    
    const key = contract.code;
    
    if (!worksMap.has(key)) {
      worksMap.set(key, {
        id: uuidv4(),
        code: contract.code,
        soHopDong: contract.soHopDong,
        soPhuLuc: contract.soPhuLuc,
        idKenh: contract.idKenh,
        tenKenh: contract.tenKenh,
        tenTacPham: contract.tenTacPham,
        tacGia: contract.tacGia,
        tacGiaNhac: contract.tacGiaNhac,
        tacGiaLoi: contract.tacGiaLoi,
        ngayBatDau: contract.ngayBatDau,
        ngayKetThuc: contract.ngayKetThuc,
        thoiLuong: contract.thoiLuong,
        hinhThuc: contract.hinhThuc,
        mucNhuanBut: contract.mucNhuanBut,
        tinhTrang: contract.tinhTrang,
        totalContracts: 1,
        totalRevenue: parseInt(contract.mucNhuanBut.replace(/,/g, '')) || 0
      });
    } else {
      const work = worksMap.get(key)!;
      work.totalContracts += 1;
      work.totalRevenue += parseInt(contract.mucNhuanBut.replace(/,/g, '')) || 0;
    }
  });
  
  return Array.from(worksMap.values());
};