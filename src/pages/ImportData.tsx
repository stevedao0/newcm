import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Database,
  File,
  X,
  Info
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import { ImportResult } from '../types/contract';
import { useNotifications } from '../contexts/NotificationContext';
import { db } from '../services/database';
import { exportContracts, exportWorks, exportPartners, exportChannels } from '../utils/exportUtils';
import { formatDate } from '../utils/formatUtils';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const ImportData: React.FC = () => {
  const [infoFile, setInfoFile] = useState<File | null>(null);
  const [workListFile, setWorkListFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  const infoFileInputRef = useRef<HTMLInputElement>(null);
  const workListFileInputRef = useRef<HTMLInputElement>(null);

  const { addNotification } = useNotifications();

  const handleInfoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setInfoFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleWorkListFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setWorkListFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          console.log('CSV parsed successfully:', results.data.length, 'rows');
          resolve(results.data);
        },
        error: (error) => {
          console.error('CSV parse error:', error);
          reject(error);
        }
      });
    });
  };

  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          console.log('Excel parsed successfully:', json.length, 'rows');
          resolve(json);
        } catch (error) {
          console.error('Excel parse error:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        console.error('File read error:', error);
        reject(error);
      };
      reader.readAsBinaryString(file);
    });
  };

  const handleImportInfo = async (data: any[]): Promise<ImportResult> => {
    try {
      console.log('Processing Info data:', data.length, 'rows');
      
      // Kiểm tra dữ liệu đã tồn tại để tránh trùng lặp
      const existingContracts = db.getAll('contracts');
      const existingContractKeys = new Set(
        existingContracts.map(c => `${c.soHopDong}-${c.soPhuLuc || ''}-${c.idKenh || ''}`)
      );
      
      const newContracts = [];
      const updatedContracts = [];
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          // Kiểm tra các trường bắt buộc
          if (!row.STT && !row['Lĩnh vực'] && !row['Ngày ký'] && !row['Số hợp đồng']) {
            errors.push(`Dòng ${i + 2}: Thiếu thông tin bắt buộc`);
            continue;
          }

          const contract = {
            id: `contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            stt: parseInt(row.STT) || i + 1,
            linhVuc: row['Lĩnh vực'] || row['Linh vuc'] || 'SCTT',
            ngayKy: row['Ngày ký'] || row['Ngay ky'] || '',
            soHopDong: row['Số hợp đồng'] || row['So hop dong'] || '',
            soPhuLuc: row['Số phụ lục'] || row['So phu luc'] || '',
            tenDonVi: row['Tên đơn vị'] || row['Ten don vi'] || '',
            diaChi: row['Địa chỉ'] || row['Dia chi'] || '',
            idKenh: row['ID Kênh'] || row['ID kenh'] || '',
            tenKenh: row['Tên kênh'] || row['Ten kenh'] || '',
            mucNhuanBut: row['Mức nhuận bút'] || row['Muc nhuan but'] || '0',
            nguoiPhuTrach: row['Người phụ trách'] || row['Nguoi phu trach'] || '',
            tinhTrang: row['Tình trạng'] || row['Tinh trang'] || 'Đã ký',
            idVideo: '',
            // Default values for required fields
            code: '',
            tenTacPham: '',
            tacGia: '',
            ngayBatDau: '',
            ngayKetThuc: '',
            hinhThuc: ''
          };

          // Kiểm tra trùng lặp
          const contractKey = `${contract.soHopDong}-${contract.soPhuLuc || ''}-${contract.idKenh || ''}`;
          if (existingContractKeys.has(contractKey)) {
            // Tìm contract hiện có để cập nhật
            const existingIndex = existingContracts.findIndex(c => 
              c.soHopDong === contract.soHopDong && 
              c.soPhuLuc === contract.soPhuLuc &&
              c.idKenh === contract.idKenh
            );
            
            if (existingIndex !== -1) {
              // Cập nhật contract hiện có
              const updatedContract = {
                ...existingContracts[existingIndex],
                ...contract,
                id: existingContracts[existingIndex].id // Giữ nguyên ID
              };
              updatedContracts.push(updatedContract);
            }
          } else {
            // Thêm mới nếu không trùng lặp
            newContracts.push(contract);
            existingContractKeys.add(contractKey); // Thêm vào set để kiểm tra trùng lặp
          }
        } catch (error) {
          errors.push(`Dòng ${i + 2}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
      }

      // Bulk create/update contracts
      if (newContracts.length > 0) {
        await db.bulkCreate('contracts', newContracts);
      }
      
      if (updatedContracts.length > 0) {
        await db.bulkUpdate('contracts', updatedContracts);
      }
      
      console.log('✅ Info import successful:', newContracts.length, 'new contracts,', updatedContracts.length, 'updated');
      
      return {
        success: true,
        message: 'Import Info thành công',
        totalRecords: newContracts.length + updatedContracts.length,
        newRecords: newContracts.length,
        updatedRecords: updatedContracts.length,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('❌ Info import error:', error);
      return {
        success: false,
        message: 'Lỗi khi import Info: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'),
        errors: [error instanceof Error ? error.message : 'Lỗi không xác định']
      };
    }
  };

  const handleImportWorkList = async (data: any[]): Promise<ImportResult> => {
    try {
      console.log('Processing WorkList data:', data.length, 'rows');
      
      // Kiểm tra dữ liệu đã tồn tại để tránh trùng lặp
      const existingContracts = db.getAll('contracts');
      const existingWorks = db.getAll('works');
      
      const existingContractKeys = new Set(
        existingContracts.map(c => `${c.soHopDong}-${c.soPhuLuc || ''}-${c.code || ''}`)
      );
      
      const existingWorkKeys = new Set(
        existingWorks.map(w => w.code || '')
      );
      
      const newContracts = [];
      const updatedContracts = [];
      const newWorks = [];
      const updatedWorks = [];
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          // Kiểm tra các trường bắt buộc
          if (!row.STT && !row['Lĩnh vực'] && !row['Ngày ký'] && !row['Số hợp đồng']) {
            errors.push(`Dòng ${i + 2}: Thiếu thông tin bắt buộc`);
            continue;
          }

          // Tìm thông tin đối tác từ contracts hiện có
          const partnerInfo = existingContracts.find(
            c => c.soHopDong === row['Số hợp đồng'] && c.soPhuLuc === (row['Số phụ lục'] || '')
          );

          // Tạo contract mới
          const contract = {
            id: `contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            stt: parseInt(row.STT) || i + 1,
            linhVuc: row['Lĩnh vực'] || row['Linh vuc'] || 'SCTT',
            ngayKy: formatDate(row['Ngày ký'] || row['Ngay ky'] || ''),
            soHopDong: row['Số hợp đồng'] || row['So hop dong'] || '',
            soPhuLuc: row['Số phụ lục'] || row['So phu luc'] || '',
            idKenh: row['ID Kênh'] || row['ID kenh'] || '',
            tenKenh: row['Tên kênh'] || row['Ten kenh'] || '',
            tenDonVi: partnerInfo?.tenDonVi || '',
            diaChi: partnerInfo?.diaChi || '',
            nguoiPhuTrach: row['Người phụ trách'] || row['Nguoi phu trach'] || '',
            tinhTrang: row['Tình trạng'] || row['Tinh trang'] || 'Đã ký',
            idVideo: row['ID Video'] || '',
            code: row.Code || '',
            tenTacPham: row['Tên tác phẩm'] || row['Ten tac pham'] || '',
            tacGia: row['Tác giả'] || row['Tac gia'] || '',
            tacGiaNhac: row['Tác giả nhạc'] || row['Tac gia nhac'] || '',
            tacGiaLoi: row['Tác giả lời'] || row['Tac gia loi'] || '',
            ngayBatDau: formatDate(row['Ngày bắt đầu'] || row['Ngay bat dau'] || ''),
            ngayKetThuc: formatDate(row['Ngày kết thúc'] || row['Ngay ket thuc'] || ''),
            thoiGian: row['Thời gian'] || row['Thoi gian'] || '',
            thoiLuong: row['Thời lượng'] || row['Thoi luong'] || '',
            hinhThuc: row['Hình thức'] || row['Hinh thuc'] || row['Hình thức'] || row['Hinh Thuc'] || row['HINH THUC'] || row['Video/Audio'] || row['Loại'] || '',
            mucNhuanBut: row['Mức nhuận bút'] || row['Muc nhuan but'] || '0',
            ghiChu1: row['Ghi chú 1'] || row['Ghi chu 1'] || '',
            ghiChu2: row['Ghi chú 2'] || row['Ghi chu 2'] || '',
            nhatKy: []
          };

          // Kiểm tra trùng lặp contract
          const contractKey = `${contract.soHopDong}-${contract.soPhuLuc || ''}-${contract.code || ''}`;
          if (existingContractKeys.has(contractKey)) {
            // Tìm contract hiện có để cập nhật
            const existingIndex = existingContracts.findIndex(c => 
              c.soHopDong === contract.soHopDong && 
              c.soPhuLuc === contract.soPhuLuc &&
              c.code === contract.code
            );
            
            if (existingIndex !== -1) {
              // Cập nhật contract hiện có
              const updatedContract = {
                ...existingContracts[existingIndex],
                ...contract,
                id: existingContracts[existingIndex].id // Giữ nguyên ID
              };
              updatedContracts.push(updatedContract);
            }
          } else {
            // Thêm mới nếu không trùng lặp
            newContracts.push(contract);
            existingContractKeys.add(contractKey); // Thêm vào set để kiểm tra trùng lặp
          }

          // Tạo work mới nếu có code
          if (contract.code && contract.tenTacPham) {
            const work = {
              id: `work-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              code: contract.code,
              soHopDong: contract.soHopDong,
              soPhuLuc: contract.soPhuLuc,
              idKenh: contract.idKenh,
              tenKenh: contract.tenKenh,
              tenTacPham: contract.tenTacPham,
              tacGia: contract.tacGia,
              tacGiaNhac: contract.tacGiaNhac,
              tacGiaLoi: contract.tacGiaLoi,
              ngayBatDau: formatDate(contract.ngayBatDau),
              ngayKetThuc: formatDate(contract.ngayKetThuc),
              thoiLuong: contract.thoiLuong,
              hinhThuc: contract.hinhThuc,
              mucNhuanBut: contract.mucNhuanBut,
              tinhTrang: contract.tinhTrang,
              totalContracts: 1,
              totalRevenue: parseInt(String(contract.mucNhuanBut).replace(/,/g, '')) || 0
            };

            // Kiểm tra trùng lặp work
            if (existingWorkKeys.has(work.code)) {
              // Tìm work hiện có để cập nhật
              const existingIndex = existingWorks.findIndex(w => w.code === work.code);
              
              if (existingIndex !== -1) {
                // Cập nhật work hiện có
                const updatedWork = {
                  ...existingWorks[existingIndex],
                  ...work,
                  id: existingWorks[existingIndex].id, // Giữ nguyên ID
                  totalContracts: existingWorks[existingIndex].totalContracts + 1,
                  totalRevenue: existingWorks[existingIndex].totalRevenue + (parseInt(String(contract.mucNhuanBut).replace(/,/g, '')) || 0)
                };
                updatedWorks.push(updatedWork);
              }
            } else {
              // Thêm mới nếu không trùng lặp
              newWorks.push(work);
              existingWorkKeys.add(work.code); // Thêm vào set để kiểm tra trùng lặp
            }
          }
        } catch (error) {
          errors.push(`Dòng ${i + 2}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
      }

      // Bulk create/update contracts
      if (newContracts.length > 0) {
        await db.bulkCreate('contracts', newContracts);
      }
      
      if (updatedContracts.length > 0) {
        await db.bulkUpdate('contracts', updatedContracts);
      }

      // Bulk create/update works
      if (newWorks.length > 0) {
        await db.bulkCreate('works', newWorks);
      }
      
      if (updatedWorks.length > 0) {
        await db.bulkUpdate('works', updatedWorks);
      }
      
      console.log('✅ WorkList import successful:', 
        newContracts.length, 'new contracts,', 
        updatedContracts.length, 'updated contracts,',
        newWorks.length, 'new works,',
        updatedWorks.length, 'updated works'
      );
      
      return {
        success: true,
        message: 'Import WorkList thành công',
        totalRecords: newContracts.length + updatedContracts.length + newWorks.length + updatedWorks.length,
        newRecords: newContracts.length + newWorks.length,
        updatedRecords: updatedContracts.length + updatedWorks.length,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('❌ WorkList import error:', error);
      return {
        success: false,
        message: 'Lỗi khi import WorkList: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'),
        errors: [error instanceof Error ? error.message : 'Lỗi không xác định']
      };
    }
  };

  const handleImport = async () => {
    if (!infoFile && !workListFile) {
      setImportResult({
        success: false,
        message: 'Vui lòng chọn ít nhất một file để import'
      });
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      let totalRecords = 0;
      let newRecords = 0;
      let updatedRecords = 0;
      const errors: string[] = [];

      // Process Info.csv if provided
      if (infoFile) {
        console.log('Processing Info file:', infoFile.name);
        let infoData: any[] = [];
        
        if (infoFile.name.toLowerCase().endsWith('.csv')) {
          infoData = await parseCSV(infoFile);
        } else if (infoFile.name.toLowerCase().endsWith('.xlsx') || infoFile.name.toLowerCase().endsWith('.xls')) {
          infoData = await parseExcel(infoFile);
        } else {
          throw new Error('File Info không đúng định dạng. Chỉ hỗ trợ CSV hoặc Excel.');
        }
        
        const infoResult = await handleImportInfo(infoData);
        if (!infoResult.success) {
          errors.push(`Info: ${infoResult.message}`);
        } else {
          totalRecords += infoResult.totalRecords || 0;
          newRecords += infoResult.newRecords || 0;
          updatedRecords += infoResult.updatedRecords || 0;
          
          if (infoResult.errors && infoResult.errors.length > 0) {
            errors.push(...infoResult.errors);
          }
        }
      }

      // Process WorkList.csv if provided
      if (workListFile) {
        console.log('Processing WorkList file:', workListFile.name);
        let workListData: any[] = [];
        
        if (workListFile.name.toLowerCase().endsWith('.csv')) {
          workListData = await parseCSV(workListFile);
        } else if (workListFile.name.toLowerCase().endsWith('.xlsx') || workListFile.name.toLowerCase().endsWith('.xls')) {
          workListData = await parseExcel(workListFile);
        } else {
          throw new Error('File WorkList không đúng định dạng. Chỉ hỗ trợ CSV hoặc Excel.');
        }
        
        const workListResult = await handleImportWorkList(workListData);
        if (!workListResult.success) {
          errors.push(`WorkList: ${workListResult.message}`);
        } else {
          totalRecords += workListResult.totalRecords || 0;
          newRecords += workListResult.newRecords || 0;
          updatedRecords += workListResult.updatedRecords || 0;
          
          if (workListResult.errors && workListResult.errors.length > 0) {
            errors.push(...workListResult.errors);
          }
        }
      }

      // Tự động tạo partners và channels từ dữ liệu contracts
      await generatePartnersAndChannels();

      const finalResult: ImportResult = {
        success: errors.length === 0 || totalRecords > 0,
        message: errors.length === 0 
          ? `Import thành công ${totalRecords} bản ghi` 
          : `Import hoàn tất với ${errors.length} lỗi`,
        totalRecords,
        newRecords,
        updatedRecords,
        errors: errors.length > 0 ? errors : undefined
      };

      setImportResult(finalResult);
      
      if (finalResult.success) {
        toast.success('Import dữ liệu thành công!');
        addNotification({
          title: 'Import thành công',
          message: `Đã import ${totalRecords} bản ghi`,
          type: 'success'
        });
        
        // Reset file inputs
        setInfoFile(null);
        setWorkListFile(null);
        if (infoFileInputRef.current) infoFileInputRef.current.value = '';
        if (workListFileInputRef.current) workListFileInputRef.current.value = '';
      } else {
        toast.error('Import có lỗi, vui lòng kiểm tra chi tiết');
      }
      
    } catch (error) {
      console.error('❌ Import error:', error);
      const errorResult: ImportResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi không xác định khi import dữ liệu',
        errors: [error instanceof Error ? error.message : 'Lỗi không xác định']
      };
      setImportResult(errorResult);
      toast.error('Có lỗi xảy ra khi import dữ liệu');
    } finally {
      setImporting(false);
    }
  };

  // Tự động tạo partners và channels từ dữ liệu contracts
  const generatePartnersAndChannels = async () => {
    try {
      const contracts = db.getAll('contracts');
      
      // Tạo partners
      const partnersMap = new Map<string, any>();
      contracts.forEach(contract => {
        if (!contract.tenDonVi) return;
        
        const key = contract.tenDonVi;
        
        if (!partnersMap.has(key)) {
          partnersMap.set(key, {
            id: `partner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            tenDonVi: contract.tenDonVi,
            diaChi: contract.diaChi,
            nguoiDaiDien: '',
            soDienThoai: '',
            email: '',
            website: '',
            soHopDongDaKy: 1,
            tongDoanhThu: parseInt(String(contract.mucNhuanBut || '0').replace(/,/g, '')) || 0,
            ghiChu: ''
          });
        } else {
          const partner = partnersMap.get(key)!;
          partner.soHopDongDaKy += 1;
          partner.tongDoanhThu += parseInt(String(contract.mucNhuanBut || '0').replace(/,/g, '')) || 0;
        }
      });
      
      // Tạo channels
      const channelsMap = new Map<string, any>();
      contracts.forEach(contract => {
        if (!contract.idKenh || !contract.tenKenh) return;
        
        const key = contract.idKenh;
        
        if (!channelsMap.has(key)) {
          channelsMap.set(key, {
            id: `channel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            idKenh: contract.idKenh,
            tenKenh: contract.tenKenh,
            platform: contract.idKenh.includes('UC') ? 'YouTube' : 'Khác',
            subscribers: 0,
            views: 0,
            nguoiPhuTrach: contract.nguoiPhuTrach,
            ngayTao: formatDate(contract.ngayKy),
            trangThai: 'Hoạt động',
            ghiChu: ''
          });
        }
      });
      
      // Lưu partners và channels vào database
      const existingPartners = db.getAll('partners');
      const existingChannels = db.getAll('channels');
      
      const existingPartnerKeys = new Set(existingPartners.map(p => p.tenDonVi));
      const existingChannelKeys = new Set(existingChannels.map(c => c.idKenh));
      
      const newPartners = Array.from(partnersMap.values())
        .filter(p => !existingPartnerKeys.has(p.tenDonVi));
      
      const newChannels = Array.from(channelsMap.values())
        .filter(c => !existingChannelKeys.has(c.idKenh));
      
      if (newPartners.length > 0) {
        await db.bulkCreate('partners', newPartners);
        console.log(`✅ Generated ${newPartners.length} new partners`);
      }
      
      if (newChannels.length > 0) {
        await db.bulkCreate('channels', newChannels);
        console.log(`✅ Generated ${newChannels.length} new channels`);
      }
    } catch (error) {
      console.error('Error generating partners and channels:', error);
    }
  };

  const handleExport = async (type: 'contracts' | 'works' | 'partners' | 'channels', format: 'csv' | 'excel' | 'pdf') => {
    try {
      let result;
      
      switch (type) {
        case 'contracts':
          const contracts = db.getAll('contracts');
          result = exportContracts(contracts, format);
          break;
        case 'works':
          const works = db.getAll('works');
          result = exportWorks(works, format);
          break;
        case 'partners':
          const partners = db.getAll('partners');
          result = exportPartners(partners, format);
          break;
        case 'channels':
          const channels = db.getAll('channels');
          result = exportChannels(channels, format);
          break;
        default:
          throw new Error('Loại dữ liệu không hợp lệ');
      }
      
      if (result.success) {
        toast.success(`Xuất ${format.toUpperCase()} thành công!`);
        addNotification({
          title: 'Xuất dữ liệu thành công',
          message: `Đã xuất ${type} ra file ${format.toUpperCase()}`,
          type: 'success'
        });
      } else {
        toast.error(`Lỗi xuất ${format.toUpperCase()}: ${result.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Có lỗi xảy ra khi xuất ${format.toUpperCase()}`);
    }
  };

  const clearAllData = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu? Hành động này không thể hoàn tác!')) {
      try {
        await db.clearAll();
        toast.success('Đã xóa tất cả dữ liệu');
        addNotification({
          title: 'Dữ liệu đã xóa',
          message: 'Tất cả dữ liệu đã được xóa khỏi hệ thống',
          type: 'warning'
        });
        setImportResult(null);
      } catch (error) {
        toast.error('Có lỗi xảy ra khi xóa dữ liệu');
      }
    }
  };

  const stats = db.getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nhập dữ liệu</h1>
          <p className="text-slate-600 mt-1">Import và export dữ liệu hệ thống</p>
        </div>
      </div>

      {/* Database Statistics */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900">Thống kê dữ liệu hiện tại</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.contracts || 0}</div>
              <div className="text-sm text-blue-800">Hợp đồng</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.works || 0}</div>
              <div className="text-sm text-green-800">Tác phẩm</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.partners || 0}</div>
              <div className="text-sm text-purple-800">Đối tác</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.channels || 0}</div>
              <div className="text-sm text-orange-800">Kênh</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">Import dữ liệu</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Info File */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  File Info.csv / Info.xlsx
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    ref={infoFileInputRef}
                    onChange={handleInfoFileChange}
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    id="info-file-input"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => infoFileInputRef.current?.click()}
                    icon={File}
                  >
                    Chọn file
                  </Button>
                  <span className="text-sm text-slate-600 truncate flex-1">
                    {infoFile ? infoFile.name : 'Chưa chọn file'}
                  </span>
                  {infoFile && (
                    <button
                      onClick={() => {
                        setInfoFile(null);
                        if (infoFileInputRef.current) infoFileInputRef.current.value = '';
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Chứa thông tin hợp đồng và đối tác
                </p>
              </div>
              
              {/* WorkList File */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  File WorkList.csv / WorkList.xlsx
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    ref={workListFileInputRef}
                    onChange={handleWorkListFileChange}
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    id="worklist-file-input"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => workListFileInputRef.current?.click()}
                    icon={File}
                  >
                    Chọn file
                  </Button>
                  <span className="text-sm text-slate-600 truncate flex-1">
                    {workListFile ? workListFile.name : 'Chưa chọn file'}
                  </span>
                  {workListFile && (
                    <button
                      onClick={() => {
                        setWorkListFile(null);
                        if (workListFileInputRef.current) workListFileInputRef.current.value = '';
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Chứa thông tin chi tiết tác phẩm
                </p>
              </div>
              
              {/* Import Button */}
              <Button 
                variant="primary" 
                icon={Upload}
                onClick={handleImport}
                disabled={importing || (!infoFile && !workListFile)}
                fullWidth
              >
                {importing ? 'Đang import...' : 'Import dữ liệu'}
              </Button>
              
              {/* Import Result */}
              {importResult && (
                <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <div className="flex items-start">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{importResult.message}</p>
                      {importResult.success && (
                        <ul className="mt-1 text-sm">
                          <li>Tổng số bản ghi: {importResult.totalRecords}</li>
                          <li>Bản ghi mới: {importResult.newRecords}</li>
                          <li>Bản ghi cập nhật: {importResult.updatedRecords}</li>
                        </ul>
                      )}
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium">Lỗi:</p>
                          <ul className="list-disc pl-5 text-sm">
                            {importResult.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importResult.errors.length > 5 && (
                              <li>...và {importResult.errors.length - 5} lỗi khác</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Format Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex">
                  <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Định dạng file hỗ trợ</p>
                    <ul className="mt-1 list-disc pl-5">
                      <li>CSV (UTF-8 encoding)</li>
                      <li>Excel (.xlsx, .xls)</li>
                      <li>Dòng đầu tiên phải là header</li>
                      <li>Các cột bắt buộc: STT, Lĩnh vực, Ngày ký, Số hợp đồng</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">Export dữ liệu</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-sm text-slate-600">
                Xuất dữ liệu hiện có trong hệ thống ra các định dạng khác nhau.
              </p>
              
              {/* Export Options */}
              <div className="space-y-4">
                {/* Contracts Export */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 mb-3">Hợp đồng ({stats.contracts || 0} bản ghi)</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('contracts', 'csv')}
                    >
                      CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('contracts', 'excel')}
                    >
                      Excel
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('contracts', 'pdf')}
                    >
                      PDF
                    </Button>
                  </div>
                </div>

                {/* Works Export */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 mb-3">Tác phẩm ({stats.works || 0} bản ghi)</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('works', 'csv')}
                    >
                      CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('works', 'excel')}
                    >
                      Excel
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('works', 'pdf')}
                    >
                      PDF
                    </Button>
                  </div>
                </div>

                {/* Partners Export */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 mb-3">Đối tác ({stats.partners || 0} bản ghi)</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('partners', 'csv')}
                    >
                      CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('partners', 'excel')}
                    >
                      Excel
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('partners', 'pdf')}
                    >
                      PDF
                    </Button>
                  </div>
                </div>

                {/* Channels Export */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 mb-3">Kênh ({stats.channels || 0} bản ghi)</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('channels', 'csv')}
                    >
                      CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('channels', 'excel')}
                    >
                      Excel
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('channels', 'pdf')}
                    >
                      PDF
                    </Button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h4 className="font-medium text-red-900 mb-2">Vùng nguy hiểm</h4>
                <p className="text-sm text-red-700 mb-3">
                  Xóa tất cả dữ liệu trong hệ thống. Hành động này không thể hoàn tác.
                </p>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={clearAllData}
                >
                  Xóa tất cả dữ liệu
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportData;