import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Contract, Work, Partner, Channel } from '../types/contract';

// Utility function to convert data to CSV
export const exportToCSV = (data: any[], filename: string) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${filename}.csv`);
    console.log('✅ CSV export successful:', filename);
    return { success: true, filename: `${filename}.csv` };
  } catch (error) {
    console.error('❌ CSV export error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Utility function to convert data to Excel
export const exportToExcel = (data: any[], filename: string) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    console.log('✅ Excel export successful:', filename);
    return { success: true, filename: `${filename}.xlsx` };
  } catch (error) {
    console.error('❌ Excel export error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Utility function to convert data to PDF
export const exportToPDF = (data: any[], columns: string[], filename: string, title: string) => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, 14, 30);
    
    // Prepare table data
    const tableData = data.map(item => {
      return columns.map(col => {
        const value = item[col];
        return value !== undefined && value !== null ? value.toString() : '';
      });
    });
    
    // Create table headers
    const tableHeaders = columns.map(col => {
      // Convert camelCase to Title Case with spaces
      return col.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
    });
    
    // Add table
    (doc as any).autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    // Save PDF
    doc.save(`${filename}.pdf`);
    console.log('✅ PDF export successful:', filename);
    return { success: true, filename: `${filename}.pdf` };
  } catch (error) {
    console.error('❌ PDF export error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Export contracts data - ENHANCED
export const exportContracts = (contracts: Contract[], format: 'csv' | 'excel' | 'pdf') => {
  try {
    // Prepare data for export - EXACT CSV FORMAT
    const data = contracts.map(contract => ({
      STT: contract.stt || '',
      'Lĩnh vực': contract.linhVuc || '',
      'Ngày ký': contract.ngayKy || '',
      'Số hợp đồng': contract.soHopDong || '',
      'Số phụ lục': contract.soPhuLuc || '',
      'Tên đơn vị': contract.tenDonVi || '',
      'Địa chỉ': contract.diaChi || '',
      'ID Kênh': contract.idKenh || '',
      'Tên kênh': contract.tenKenh || '',
      'Người phụ trách': contract.nguoiPhuTrach || '',
      'Tình trạng': contract.tinhTrang || '',
      'Code': contract.code || '',
      'Tên tác phẩm': contract.tenTacPham || '',
      'Tác giả': contract.tacGia || '',
      'Tác giả nhạc': contract.tacGiaNhac || '',
      'Tác giả lời': contract.tacGiaLoi || '',
      'Ngày bắt đầu': contract.ngayBatDau || '',
      'Ngày kết thúc': contract.ngayKetThuc || '',
      'Thời gian': contract.thoiGian || '',
      'Thời lượng': contract.thoiLuong || '',
      'Hình thức': contract.hinhThuc || '',
      'Mức nhuận bút': contract.mucNhuanBut || '',
      'Ghi chú 1': contract.ghiChu1 || '',
      'Ghi chú 2': contract.ghiChu2 || ''
    }));

    const columns = [
      'STT', 'Lĩnh vực', 'Ngày ký', 'Số hợp đồng', 'Số phụ lục', 'Tên đơn vị', 'Địa chỉ',
      'ID Kênh', 'Tên kênh', 'Người phụ trách', 'Tình trạng', 'Code', 'Tên tác phẩm', 
      'Tác giả', 'Tác giả nhạc', 'Tác giả lời', 'Ngày bắt đầu', 'Ngày kết thúc', 
      'Thời gian', 'Thời lượng', 'Hình thức', 'Mức nhuận bút', 'Ghi chú 1', 'Ghi chú 2'
    ];

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `contracts-${timestamp}`;

    if (format === 'csv') {
      return exportToCSV(data, filename);
    } else if (format === 'excel') {
      return exportToExcel(data, filename);
    } else if (format === 'pdf') {
      return exportToPDF(data, columns, filename, 'Báo Cáo Hợp Đồng');
    }

    return { success: false, error: 'Định dạng không hỗ trợ' };
  } catch (error) {
    console.error('❌ Export contracts error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Export works data - ENHANCED
export const exportWorks = (works: Work[], format: 'csv' | 'excel' | 'pdf') => {
  try {
    // Prepare data for export - EXACT CSV FORMAT
    const data = works.map(work => ({
      'Code': work.code || '',
      'Số hợp đồng': work.soHopDong || '',
      'Số phụ lục': work.soPhuLuc || '',
      'ID Kênh': work.idKenh || '',
      'Tên kênh': work.tenKenh || '',
      'Tên tác phẩm': work.tenTacPham || '',
      'Tác giả': work.tacGia || '',
      'Tác giả nhạc': work.tacGiaNhac || '',
      'Tác giả lời': work.tacGiaLoi || '',
      'Ngày bắt đầu': work.ngayBatDau || '',
      'Ngày kết thúc': work.ngayKetThuc || '',
      'Thời lượng': work.thoiLuong || '',
      'Hình thức': work.hinhThuc || '',
      'Mức nhuận bút': work.mucNhuanBut || '',
      'Tình trạng': work.tinhTrang || '',
      'Số hợp đồng đã ký': work.totalContracts || 0,
      'Tổng doanh thu': work.totalRevenue || 0
    }));

    const columns = [
      'Code', 'Số hợp đồng', 'Số phụ lục', 'ID Kênh', 'Tên kênh', 'Tên tác phẩm', 
      'Tác giả', 'Tác giả nhạc', 'Tác giả lời', 'Ngày bắt đầu', 'Ngày kết thúc', 
      'Thời lượng', 'Hình thức', 'Mức nhuận bút', 'Tình trạng', 'Số hợp đồng đã ký', 'Tổng doanh thu'
    ];

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `works-${timestamp}`;

    if (format === 'csv') {
      return exportToCSV(data, filename);
    } else if (format === 'excel') {
      return exportToExcel(data, filename);
    } else if (format === 'pdf') {
      return exportToPDF(data, columns, filename, 'Báo Cáo Tác Phẩm');
    }

    return { success: false, error: 'Định dạng không hỗ trợ' };
  } catch (error) {
    console.error('❌ Export works error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Export partners data - ENHANCED
export const exportPartners = (partners: Partner[], format: 'csv' | 'excel' | 'pdf') => {
  try {
    // Prepare data for export
    const data = partners.map(partner => ({
      'Tên đơn vị': partner.tenDonVi || '',
      'Địa chỉ': partner.diaChi || '',
      'Người đại diện': partner.nguoiDaiDien || '',
      'Số điện thoại': partner.soDienThoai || '',
      'Email': partner.email || '',
      'Website': partner.website || '',
      'Số hợp đồng đã ký': partner.soHopDongDaKy || 0,
      'Tổng doanh thu': partner.tongDoanhThu || 0,
      'Ghi chú': partner.ghiChu || ''
    }));

    const columns = [
      'Tên đơn vị', 'Địa chỉ', 'Người đại diện', 'Số điện thoại', 'Email', 
      'Website', 'Số hợp đồng đã ký', 'Tổng doanh thu', 'Ghi chú'
    ];

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `partners-${timestamp}`;

    if (format === 'csv') {
      return exportToCSV(data, filename);
    } else if (format === 'excel') {
      return exportToExcel(data, filename);
    } else if (format === 'pdf') {
      return exportToPDF(data, columns, filename, 'Báo Cáo Đối Tác');
    }

    return { success: false, error: 'Định dạng không hỗ trợ' };
  } catch (error) {
    console.error('❌ Export partners error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Export channels data - ENHANCED
export const exportChannels = (channels: Channel[], format: 'csv' | 'excel' | 'pdf') => {
  try {
    // Prepare data for export
    const data = channels.map(channel => ({
      'ID Kênh': channel.idKenh || '',
      'Tên kênh': channel.tenKenh || '',
      'Nền tảng': channel.platform || '',
      'Người đăng ký': channel.subscribers || 0,
      'Lượt xem': channel.views || 0,
      'Người phụ trách': channel.nguoiPhuTrach || '',
      'Ngày tạo': channel.ngayTao || '',
      'Trạng thái': channel.trangThai || '',
      'Ghi chú': channel.ghiChu || ''
    }));

    const columns = [
      'ID Kênh', 'Tên kênh', 'Nền tảng', 'Người đăng ký', 'Lượt xem', 
      'Người phụ trách', 'Ngày tạo', 'Trạng thái', 'Ghi chú'
    ];

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `channels-${timestamp}`;

    if (format === 'csv') {
      return exportToCSV(data, filename);
    } else if (format === 'excel') {
      return exportToExcel(data, filename);
    } else if (format === 'pdf') {
      return exportToPDF(data, columns, filename, 'Báo Cáo Kênh');
    }

    return { success: false, error: 'Định dạng không hỗ trợ' };
  } catch (error) {
    console.error('❌ Export channels error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Export report data - ENHANCED
export const exportReport = (data: any[], title: string, format: 'csv' | 'excel' | 'pdf') => {
  try {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `report-${title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;
    
    const columns = Object.keys(data[0] || {});
    
    if (format === 'csv') {
      return exportToCSV(data, filename);
    } else if (format === 'excel') {
      return exportToExcel(data, filename);
    } else if (format === 'pdf') {
      return exportToPDF(data, columns, filename, title);
    }

    return { success: false, error: 'Định dạng không hỗ trợ' };
  } catch (error) {
    console.error('❌ Export report error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};