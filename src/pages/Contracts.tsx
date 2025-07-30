import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  Link2,
  FileSpreadsheet,
  Clock
} from 'lucide-react';
import { contractsData } from '../data/contracts';
import { Contract } from '../types/contract';
import Button from '../components/ui/Button';
import Card, { CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import InfiniteScroll from '../components/ui/InfiniteScroll';
import { useNotifications } from '../contexts/NotificationContext';
import { db } from '../services/database';
import { formatCurrency, formatDate } from '../utils/formatUtils';
import { exportContracts } from '../utils/exportUtils';
import toast from 'react-hot-toast';

const Contracts: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [responsibleFilter, setResponsibleFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortField, setSortField] = useState<keyof Contract>('ngayKy');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });

  const { addNotification } = useNotifications();

  useEffect(() => {
    loadContracts();
    
    // Subscribe to database changes
    const unsubscribe = db.subscribe('contracts', () => {
      console.log('Contracts data changed, reloading...');
      loadContracts();
    });
    return unsubscribe;
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      let dbContracts = db.getAll('contracts');
      
      if (dbContracts.length === 0) {
        console.log('No contracts in database, initializing with sample data...');
        // Initialize with sample data
        const contractsWithIds = contractsData.map(contract => ({
          ...contract,
          id: contract.id || `contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
        
        await Promise.all(contractsWithIds.map(contract => db.create('contracts', contract)));
        dbContracts = db.getAll('contracts');
      }
      
      console.log('Loaded contracts:', dbContracts.length);
      setContracts(dbContracts);
    } catch (error) {
      console.error('Error loading contracts:', error);
      // Fallback to static data
      setContracts(contractsData);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Contract) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Contract) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Memoized filtered and sorted contracts
  const filteredAndSortedContracts = useMemo(() => {
    return contracts
      .filter(contract => {
        const matchesSearch = 
          (contract.tenTacPham && contract.tenTacPham.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contract.soHopDong && contract.soHopDong.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contract.tenKenh && contract.tenKenh.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contract.tenDonVi && contract.tenDonVi.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesField = fieldFilter === 'all' || contract.linhVuc === fieldFilter;
        const matchesStatus = statusFilter === 'all' || contract.tinhTrang === statusFilter;
        const matchesResponsible = responsibleFilter === 'all' || contract.nguoiPhuTrach === responsibleFilter;
        
        const matchesFilters = 
          (!filters.startDate || new Date(formatDate(contract.ngayKy).split('/').reverse().join('-')) >= new Date(filters.startDate)) &&
          (!filters.endDate || new Date(formatDate(contract.ngayKy).split('/').reverse().join('-')) <= new Date(filters.endDate)) &&
          (!filters.minAmount || parseInt(contract.mucNhuanBut.replace(/,/g, '')) >= parseInt(filters.minAmount)) &&
          (!filters.maxAmount || parseInt(contract.mucNhuanBut.replace(/,/g, '')) <= parseInt(filters.maxAmount));

        return matchesSearch && matchesField && matchesStatus && matchesResponsible && matchesFilters;
      })
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
  }, [contracts, searchTerm, fieldFilter, statusFilter, responsibleFilter, filters, sortField, sortDirection]);

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setIsDetailModalOpen(true);
  };

  const handleEditContract = (contract: Contract, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedContract(contract);
    setIsEditMode(true);
    setIsFormModalOpen(true);
  };

  const handleDeleteContract = (contract: Contract, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedContract(contract);
    setIsDeleteModalOpen(true);
  };

  const handleAddContract = () => {
    setSelectedContract(null);
    setIsEditMode(false);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const contractData = {
      stt: parseInt(formData.get('stt') as string) || contracts.length + 1,
      linhVuc: formData.get('linhVuc') as string,
      ngayKy: formData.get('ngayKy') as string,
      soHopDong: formData.get('soHopDong') as string,
      soPhuLuc: formData.get('soPhuLuc') as string,
      tenDonVi: formData.get('tenDonVi') as string,
      diaChi: formData.get('diaChi') as string,
      idKenh: formData.get('idKenh') as string,
      tenKenh: formData.get('tenKenh') as string,
      nguoiPhuTrach: formData.get('nguoiPhuTrach') as string,
      tinhTrang: formData.get('tinhTrang') as Contract['tinhTrang'],
      code: formData.get('code') as string,
      tenTacPham: formData.get('tenTacPham') as string,
      tacGia: formData.get('tacGia') as string,
      tacGiaNhac: formData.get('tacGiaNhac') as string,
      tacGiaLoi: formData.get('tacGiaLoi') as string,
      ngayBatDau: formData.get('ngayBatDau') as string,
      ngayKetThuc: formData.get('ngayKetThuc') as string,
      thoiGian: formData.get('thoiGian') as string,
      thoiLuong: formData.get('thoiLuong') as string,
      hinhThuc: formData.get('hinhThuc') as string,
      mucNhuanBut: formData.get('mucNhuanBut') as string,
      ghiChu1: formData.get('ghiChu1') as string,
      ghiChu2: formData.get('ghiChu2') as string
    };

    try {
      if (isEditMode && selectedContract) {
        await db.update('contracts', selectedContract.id, contractData);
        toast.success('Cập nhật hợp đồng thành công!');
        addNotification({
          title: 'Hợp đồng được cập nhật',
          message: `Hợp đồng ${contractData.soHopDong} đã được cập nhật`,
          type: 'success'
        });
      } else {
        await db.create('contracts', contractData);
        toast.success('Thêm hợp đồng thành công!');
        addNotification({
          title: 'Hợp đồng mới',
          message: `Hợp đồng ${contractData.soHopDong} đã được thêm`,
          type: 'success'
        });
      }
      setIsFormModalOpen(false);
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('Có lỗi xảy ra khi lưu hợp đồng');
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedContract) {
      try {
        await db.delete('contracts', selectedContract.id);
        toast.success('Xóa hợp đồng thành công!');
        addNotification({
          title: 'Hợp đồng đã xóa',
          message: `Hợp đồng ${selectedContract.soHopDong} đã được xóa`,
          type: 'info'
        });
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error('Error deleting contract:', error);
        toast.error('Có lỗi xảy ra khi xóa hợp đồng');
      }
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const result = exportContracts(filteredAndSortedContracts, format);
      if (result.success) {
        toast.success(`Xuất ${format.toUpperCase()} thành công!`);
      } else {
        toast.error(`Lỗi xuất ${format.toUpperCase()}: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Có lỗi xảy ra khi xuất ${format.toUpperCase()}`);
    }
  };

  const renderContractCard = (contract: Contract, index: number) => (
    <div 
      className="card-uniform bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group hover-lift h-[280px]"
      onClick={() => handleViewContract(contract)}
    >
      <div className={`card-header h-16 bg-gradient-to-br from-blue-500 to-purple-600 relative flex items-center justify-center p-2`}>
        <div className="absolute top-2 left-2 text-white text-xs font-medium">
          {contract.linhVuc}
        </div>
        <div className="absolute top-2 right-2">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            contract.tinhTrang === 'Đã ký' ? 'bg-green-100 bg-opacity-80 text-green-800' :
            contract.tinhTrang === 'Tái ký' ? 'bg-blue-100 bg-opacity-80 text-blue-800' :
            contract.tinhTrang === 'Ký mới' ? 'bg-yellow-100 bg-opacity-80 text-yellow-800' :
            contract.tinhTrang === 'Khảo sát' ? 'bg-purple-100 bg-opacity-80 text-purple-800' :
            contract.tinhTrang === 'Đàm phán' ? 'bg-orange-100 bg-opacity-80 text-orange-800' :
            'bg-slate-100 bg-opacity-80 text-slate-800'
          }`}>
            {contract.tinhTrang}
          </span>
        </div>
        <FileText className="w-6 h-6 text-white opacity-80" />
      </div>
      
      <div className="card-content p-3 flex flex-col h-[calc(280px-4rem)]">
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center mb-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-slate-500 flex-shrink-0" />
            <div className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors">
              {contract.soHopDong}
              {contract.soPhuLuc && <span className="ml-1 text-xs text-slate-500">({contract.soPhuLuc})</span>}
            </div>
          </div>
          
          <div className="flex items-center mb-1.5">
            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500 flex-shrink-0" />
            <span className="text-xs text-slate-600">{formatDate(contract.ngayKy)}</span>
          </div>
          
          <div className="flex items-center mb-1.5">
            <Link2 className="w-3.5 h-3.5 mr-1 text-slate-500 flex-shrink-0" />
            <a 
              href={`https://youtube.com/channel/${contract.idKenh}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-600 hover:underline truncate"
            >
              {contract.tenKenh} ({contract.idKenh})
            </a>
          </div>
          
          <div className="flex items-start mb-1.5">
            <Building2 className="w-3.5 h-3.5 mr-1 text-slate-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 line-clamp-2">
              {contract.tenDonVi}
            </div>
          </div>
          
          <div className="flex items-center mb-1.5">
            <User className="w-3.5 h-3.5 mr-1 text-slate-500 flex-shrink-0" />
            <span className="text-xs text-slate-600">{contract.nguoiPhuTrach}</span>
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Nhuận bút</p>
              <p className="text-sm font-medium text-slate-900">
                {formatCurrency(contract.mucNhuanBut)}
              </p>
            </div>
            
            <div className="flex space-x-1">
              <button 
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewContract(contract);
                }}
                title="Xem chi tiết"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button 
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                onClick={(e) => handleEditContract(contract, e)}
                title="Chỉnh sửa"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button 
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                onClick={(e) => handleDeleteContract(contract, e)}
                title="Xóa"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleLoadMore = () => {
    console.log('Loading more contracts...');
    // This function will be called by InfiniteScroll when the user scrolls to the bottom
    // In this implementation, we're already loading all filtered items at once
    // But we keep this function for future pagination implementation
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Quản lý Hợp đồng</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Quản lý tất cả hợp đồng sao chép trực tuyến</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative group">
            <Button 
              variant="success" 
              icon={Download}
            >
              Xuất Excel
            </Button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button 
                onClick={() => handleExport('csv')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 rounded-t-lg"
              >
                Xuất CSV
              </button>
              <button 
                onClick={() => handleExport('excel')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                Xuất Excel
              </button>
              <button 
                onClick={() => handleExport('pdf')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 rounded-b-lg"
              >
                Xuất PDF
              </button>
            </div>
          </div>
          <Button 
            variant="primary" 
            icon={Plus}
            onClick={handleAddContract}
          >
            Tạo hợp đồng mới
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tác phẩm, kênh..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select 
                  value={fieldFilter}
                  onChange={(e) => setFieldFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả lĩnh vực</option>
                  <option value="Sao chép trực tuyến">Sao chép trực tuyến</option>
                  <option value="Biểu diễn">Biểu diễn</option>
                  <option value="Phát sóng">Phát sóng</option>
                </select>

                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Đã ký">Đã ký</option>
                  <option value="Tái ký">Tái ký</option>
                  <option value="Ký mới">Ký mới</option>
                  <option value="Khảo sát">Khảo sát</option>
                  <option value="Đàm phán">Đàm phán</option>
                </select>

                <select 
                  value={responsibleFilter}
                  onChange={(e) => setResponsibleFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả người phụ trách</option>
                  <option value="Tuấn">Tuấn</option>
                  <option value="Bình">Bình</option>
                  <option value="Nghĩa">Nghĩa</option>
                  <option value="Trân">Trân</option>
                </select>
                
                <div className="flex space-x-2 border border-slate-300 rounded-lg overflow-hidden">
                  <button 
                    className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-600'}`}
                    onClick={() => setViewMode('grid')}
                    title="Xem dạng lưới"
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button 
                    className={`px-3 py-2 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-600'}`}
                    onClick={() => setViewMode('table')}
                    title="Xem dạng bảng"
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
                
                <Button 
                  variant="outline" 
                  icon={Filter}
                  onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                >
                  Lọc nâng cao
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilter && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nhuận bút tối thiểu
                  </label>
                  <input
                    type="number"
                    value={filters.minAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nhuận bút tối đa
                  </label>
                  <input
                    type="number"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10000000"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Tìm thấy {filteredAndSortedContracts.length} hợp đồng</span>
        <div className="flex items-center space-x-2">
          <span>Sắp xếp theo:</span>
          <select 
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSortField(field as keyof Contract);
              setSortDirection(direction as 'asc' | 'desc');
            }}
            className="px-2 py-1 border border-slate-300 rounded text-sm"
          >
            <option value="ngayKy-desc">Ngày ký (Mới-Cũ)</option>
            <option value="ngayKy-asc">Ngày ký (Cũ-Mới)</option>
            <option value="soHopDong-asc">Số hợp đồng (A-Z)</option>
            <option value="soHopDong-desc">Số hợp đồng (Z-A)</option>
            <option value="mucNhuanBut-desc">Nhuận bút (Cao-Thấp)</option>
            <option value="mucNhuanBut-asc">Nhuận bút (Thấp-Cao)</option>
            <option value="tenKenh-asc">Kênh (A-Z)</option>
            <option value="tenKenh-desc">Kênh (Z-A)</option>
            <option value="linhVuc-asc">Lĩnh vực (A-Z)</option>
            <option value="linhVuc-desc">Lĩnh vực (Z-A)</option>
            <option value="tinhTrang-asc">Tình trạng (A-Z)</option>
            <option value="tinhTrang-desc">Tình trạng (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Contracts Grid View with Infinite Scroll */}
      {viewMode === 'grid' && (
        <div className="min-h-[500px]">
          <InfiniteScroll
            items={filteredAndSortedContracts}
            renderItem={renderContractCard}
            loadMore={handleLoadMore}
            hasMore={true} // Set to true to enable infinite scroll
            loading={loading}
            itemsPerLoad={24}
            className="min-h-[500px]"
          />
        </div>
      )}

      {/* Contracts Table View */}
      {viewMode === 'table' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('linhVuc')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Lĩnh vực</span>
                      {getSortIcon('linhVuc')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('ngayKy')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Ngày ký</span>
                      {getSortIcon('ngayKy')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('soHopDong')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Số hợp đồng</span>
                      {getSortIcon('soHopDong')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Số phụ lục
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('tenKenh')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Kênh</span>
                      {getSortIcon('tenKenh')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('tenDonVi')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Đơn vị</span>
                      {getSortIcon('tenDonVi')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('mucNhuanBut')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nhuận bút</span>
                      {getSortIcon('mucNhuanBut')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('tinhTrang')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Trạng thái</span>
                      {getSortIcon('tinhTrang')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredAndSortedContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewContract(contract)}>
                    <td className="px-4 py-3 text-sm text-slate-600">{contract.linhVuc}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(contract.ngayKy)}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">{contract.soHopDong}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{contract.soPhuLuc || '-'}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{contract.tenKenh}</div>
                        <a 
                          href={`https://youtube.com/channel/${contract.idKenh}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-600 hover:underline font-mono"
                        >
                          {contract.idKenh}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-slate-900 line-clamp-1">{contract.tenDonVi}</div>
                        <div className="text-xs text-slate-500">{contract.nguoiPhuTrach}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {formatCurrency(contract.mucNhuanBut)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        contract.tinhTrang === 'Đã ký' ? 'bg-green-100 text-green-800' :
                        contract.tinhTrang === 'Tái ký' ? 'bg-blue-100 text-blue-800' :
                        contract.tinhTrang === 'Ký mới' ? 'bg-yellow-100 text-yellow-800' :
                        contract.tinhTrang === 'Khảo sát' ? 'bg-purple-100 text-purple-800' :
                        contract.tinhTrang === 'Đàm phán' ? 'bg-orange-100 text-orange-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {contract.tinhTrang}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewContract(contract);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditContract(contract, e);
                          }}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContract(contract, e);
                          }}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Contract Detail Modal */}
      {selectedContract && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Chi tiết hợp đồng"
          size="xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Thông tin hợp đồng</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Lĩnh vực</p>
                  <p className="text-base font-medium">{selectedContract.linhVuc}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Ngày ký</p>
                  <p className="text-base">{formatDate(selectedContract.ngayKy)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Số hợp đồng</p>
                  <p className="text-base font-medium">{selectedContract.soHopDong}</p>
                </div>
                
                {selectedContract.soPhuLuc && (
                  <div>
                    <p className="text-sm text-slate-500">Số phụ lục</p>
                    <p className="text-base">{selectedContract.soPhuLuc}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-slate-500">Tên kênh (ID kênh)</p>
                  <p className="text-base">{selectedContract.tenKenh}</p>
                  <p className="text-xs text-slate-500 font-mono">
                    <a 
                      href={`https://youtube.com/channel/${selectedContract.idKenh}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {selectedContract.idKenh}
                    </a>
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Tình trạng</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    selectedContract.tinhTrang === 'Đã ký' ? 'bg-green-100 text-green-800' :
                    selectedContract.tinhTrang === 'Tái ký' ? 'bg-blue-100 text-blue-800' :
                    selectedContract.tinhTrang === 'Ký mới' ? 'bg-yellow-100 text-yellow-800' :
                    selectedContract.tinhTrang === 'Khảo sát' ? 'bg-purple-100 text-purple-800' :
                    selectedContract.tinhTrang === 'Đàm phán' ? 'bg-orange-100 text-orange-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {selectedContract.tinhTrang}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Mức nhuận bút</p>
                  <p className="text-base font-medium">{formatCurrency(selectedContract.mucNhuanBut)}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Thông tin đối tác</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Tên đơn vị</p>
                  <p className="text-base">{selectedContract.tenDonVi}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Địa chỉ</p>
                  <p className="text-base">{selectedContract.diaChi}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Người phụ trách</p>
                  <p className="text-base">{selectedContract.nguoiPhuTrach}</p>
                </div>
              </div>
              
              {selectedContract.tenTacPham && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Thông tin tác phẩm</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-500">Tên tác phẩm</p>
                      <p className="text-base">{selectedContract.tenTacPham}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-500">Tác giả</p>
                      <p className="text-base">{selectedContract.tacGia}</p>
                    </div>
                    
                    {selectedContract.hinhThuc && (
                      <div>
                        <p className="text-sm text-slate-500">Hình thức</p>
                        <p className="text-base">{selectedContract.hinhThuc}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setIsDetailModalOpen(false)}
            >
              Đóng
            </Button>
            <Button 
              variant="primary" 
              icon={Edit}
              onClick={() => {
                setIsDetailModalOpen(false);
                setIsEditMode(true);
                setIsFormModalOpen(true);
              }}
            >
              Chỉnh sửa
            </Button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xác nhận xóa"
        size="sm"
      >
        <div className="py-4">
          <p className="text-slate-700">
            Bạn có chắc chắn muốn xóa hợp đồng <span className="font-semibold">{selectedContract?.soHopDong}</span>?
          </p>
          <p className="mt-2 text-slate-500 text-sm">
            Hành động này không thể hoàn tác.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3 mt-4">
          <Button 
            variant="outline" 
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Hủy
          </Button>
          <Button 
            variant="danger" 
            icon={Trash2}
            onClick={handleDeleteConfirm}
          >
            Xóa
          </Button>
        </div>
      </Modal>

      {/* Add/Edit Contract Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={isEditMode ? "Chỉnh sửa hợp đồng" : "Thêm hợp đồng mới"}
        size="xl"
      >
        <div className="py-4">
          <form className="space-y-6" onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lĩnh vực <span className="text-red-500">*</span>
                </label>
                <select
                  name="linhVuc"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedContract?.linhVuc || ''}
                  required
                >
                  <option value="">-- Chọn lĩnh vực --</option>
                  <option value="Sao chép trực tuyến">Sao chép trực tuyến</option>
                  <option value="Biểu diễn">Biểu diễn</option>
                  <option value="Phát sóng">Phát sóng</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ngày ký <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="ngayKy"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedContract?.ngayKy ? formatDate(selectedContract.ngayKy).split('/').reverse().join('-') : ''}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Số hợp đồng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="soHopDong"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedContract?.soHopDong || ''}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Số phụ lục
                </label>
                <input
                  type="text"
                  name="soPhuLuc"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedContract?.soPhuLuc || ''}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tên đơn vị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tenDonVi"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={selectedContract?.tenDonVi || ''}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <textarea
                name="diaChi"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                defaultValue={selectedContract?.diaChi || ''}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ID Kênh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="idKenh"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedContract?.idKenh || ''}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên kênh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="tenKenh"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedContract?.tenKenh || ''}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Người phụ trách <span className="text-red-500">*</span>
                </label>
                <select
                  name="nguoiPhuTrach"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedContract?.nguoiPhuTrach || ''}
                  required
                >
                  <option value="">-- Chọn người phụ trách --</option>
                  <option value="Tuấn">Tuấn</option>
                  <option value="Bình">Bình</option>
                  <option value="Nghĩa">Nghĩa</option>
                  <option value="Trân">Trân</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tình trạng <span className="text-red-500">*</span>
                </label>
                <select
                  name="tinhTrang"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedContract?.tinhTrang || 'Đã ký'}
                  required
                >
                  <option value="Đã ký">Đã ký</option>
                  <option value="Tái ký">Tái ký</option>
                  <option value="Ký mới">Ký mới</option>
                  <option value="Khảo sát">Khảo sát</option>
                  <option value="Đàm phán">Đàm phán</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mức nhuận bút (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="mucNhuanBut"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={selectedContract?.mucNhuanBut || ''}
                placeholder="1,000,000"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsFormModalOpen(false)}
              >
                Hủy
              </Button>
              <Button 
                variant="primary" 
                type="submit"
              >
                {isEditMode ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Contracts;