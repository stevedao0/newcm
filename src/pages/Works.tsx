import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Music,
  User,
  Calendar,
  DollarSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  Clock,
  FileText,
  Link2
} from 'lucide-react';
import { contractsData } from '../data/contracts';
import { Work } from '../types/contract';
import Button from '../components/ui/Button';
import Card, { CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import InfiniteScroll from '../components/ui/InfiniteScroll';
import { useNotifications } from '../contexts/NotificationContext';
import { db } from '../services/database';
import { formatCurrency, formatDate } from '../utils/formatUtils';
import { exportWorks } from '../utils/exportUtils';
import { extractWorks } from '../utils/importUtils';
import toast from 'react-hot-toast';

const Works: React.FC = () => {
  const [works, setWorks] = useState<Work[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortField, setSortField] = useState<keyof Work>('tenTacPham');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minRevenue: '',
    maxRevenue: ''
  });

  const { addNotification } = useNotifications();

  useEffect(() => {
    loadWorks();
    
    // Subscribe to database changes
    const unsubscribe = db.subscribe('works', () => {
      console.log('Works data changed, reloading...');
      loadWorks();
    });
    return unsubscribe;
  }, []);

  const loadWorks = async () => {
    setLoading(true);
    try {
      let dbWorks = db.getAll('works');
      
      if (dbWorks.length === 0) {
        console.log('No works in database, generating from contracts...');
        // Generate works from contracts
        const contracts = db.getAll('contracts');
        if (contracts.length === 0) {
          // Initialize with sample data if no contracts
          const contractsWithIds = contractsData.map(contract => ({
            ...contract,
            id: contract.id || `contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }));
          
          await Promise.all(contractsWithIds.map(contract => db.create('contracts', contract)));
        }
        
        // Extract works from contracts
        const allContracts = db.getAll('contracts');
        const extractedWorks = extractWorks(allContracts);
        
        await Promise.all(extractedWorks.map(work => db.create('works', work)));
        dbWorks = db.getAll('works');
      }
      
      console.log('Loaded works:', dbWorks.length);
      setWorks(dbWorks);
    } catch (error) {
      console.error('Error loading works:', error);
      // Fallback to extracted works from static data
      const extractedWorks = extractWorks(contractsData);
      setWorks(extractedWorks);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Work) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Work) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Memoized filtered and sorted works
  const filteredAndSortedWorks = useMemo(() => {
    return works
      .filter(work => {
        const matchesSearch = 
          (work.tenTacPham && work.tenTacPham.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (work.code && work.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (work.tacGia && work.tacGia.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (work.tenKenh && work.tenKenh.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === 'all' || work.tinhTrang === statusFilter;
        const matchesFormat = formatFilter === 'all' || work.hinhThuc === formatFilter;
        
        const matchesFilters = 
          (!filters.startDate || new Date(formatDate(work.ngayBatDau).split('/').reverse().join('-')) >= new Date(filters.startDate)) &&
          (!filters.endDate || new Date(formatDate(work.ngayKetThuc).split('/').reverse().join('-')) <= new Date(filters.endDate)) &&
          (!filters.minRevenue || work.totalRevenue >= parseInt(filters.minRevenue)) &&
          (!filters.maxRevenue || work.totalRevenue <= parseInt(filters.maxRevenue));

        return matchesSearch && matchesStatus && matchesFormat && matchesFilters;
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
  }, [works, searchTerm, statusFilter, formatFilter, filters, sortField, sortDirection]);

  const handleViewWork = (work: Work) => {
    setSelectedWork(work);
    setIsDetailModalOpen(true);
  };

  const handleEditWork = (work: Work, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedWork(work);
    setIsEditMode(true);
    setIsFormModalOpen(true);
  };

  const handleDeleteWork = (work: Work, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedWork(work);
    setIsDeleteModalOpen(true);
  };

  const handleAddWork = () => {
    setSelectedWork(null);
    setIsEditMode(false);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const workData = {
      code: formData.get('code') as string,
      soHopDong: formData.get('soHopDong') as string,
      soPhuLuc: formData.get('soPhuLuc') as string,
      idKenh: formData.get('idKenh') as string,
      tenKenh: formData.get('tenKenh') as string,
      tenTacPham: formData.get('tenTacPham') as string,
      tacGia: formData.get('tacGia') as string,
      tacGiaNhac: formData.get('tacGiaNhac') as string,
      tacGiaLoi: formData.get('tacGiaLoi') as string,
      ngayBatDau: formData.get('ngayBatDau') as string,
      ngayKetThuc: formData.get('ngayKetThuc') as string,
      thoiLuong: formData.get('thoiLuong') as string,
      hinhThuc: formData.get('hinhThuc') as string,
      mucNhuanBut: formData.get('mucNhuanBut') as string,
      tinhTrang: formData.get('tinhTrang') as Work['tinhTrang'],
      totalContracts: parseInt(formData.get('totalContracts') as string) || 1,
      totalRevenue: parseInt(formData.get('totalRevenue') as string) || 0
    };

    try {
      if (isEditMode && selectedWork) {
        await db.update('works', selectedWork.id, workData);
        toast.success('Cập nhật tác phẩm thành công!');
        addNotification({
          title: 'Tác phẩm được cập nhật',
          message: `Tác phẩm ${workData.tenTacPham} đã được cập nhật`,
          type: 'success'
        });
      } else {
        await db.create('works', workData);
        toast.success('Thêm tác phẩm thành công!');
        addNotification({
          title: 'Tác phẩm mới',
          message: `Tác phẩm ${workData.tenTacPham} đã được thêm`,
          type: 'success'
        });
      }
      setIsFormModalOpen(false);
    } catch (error) {
      console.error('Error saving work:', error);
      toast.error('Có lỗi xảy ra khi lưu tác phẩm');
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedWork) {
      try {
        await db.delete('works', selectedWork.id);
        toast.success('Xóa tác phẩm thành công!');
        addNotification({
          title: 'Tác phẩm đã xóa',
          message: `Tác phẩm ${selectedWork.tenTacPham} đã được xóa`,
          type: 'info'
        });
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error('Error deleting work:', error);
        toast.error('Có lỗi xảy ra khi xóa tác phẩm');
      }
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const result = exportWorks(filteredAndSortedWorks, format);
      if (result.success) {
        toast.success(`Xuất ${format.toUpperCase()} thành công!`);
      } else {
        toast.error(`Lỗi xuất ${format.toUpperCase()}: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Có lỗi xảy ra khi xuất ${format.toUpperCase()}`);
    }
  };

  const renderWorkCard = (work: Work, index: number) => (
    <div 
      className="card-uniform bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group hover-lift h-[280px]"
      onClick={() => handleViewWork(work)}
    >
      <div className="card-header bg-gradient-to-br from-purple-500 to-pink-600 relative flex items-center justify-center">
        <Music className="w-8 h-8 text-white opacity-80" />
        <div className="absolute top-2 right-2">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            work.tinhTrang === 'Đã ký' ? 'bg-green-100 bg-opacity-80 text-green-800' :
            work.tinhTrang === 'Tái ký' ? 'bg-blue-100 bg-opacity-80 text-blue-800' :
            work.tinhTrang === 'Ký mới' ? 'bg-yellow-100 bg-opacity-80 text-yellow-800' :
            work.tinhTrang === 'Khảo sát' ? 'bg-purple-100 bg-opacity-80 text-purple-800' :
            work.tinhTrang === 'Đàm phán' ? 'bg-orange-100 bg-opacity-80 text-orange-800' :
            'bg-slate-100 bg-opacity-80 text-slate-800'
          }`}>
            {work.tinhTrang}
          </span>
        </div>
        <div className="absolute bottom-2 left-2 text-white text-xs font-medium">
          {work.hinhThuc}
        </div>
      </div>
      
      <div className="card-content p-3 flex flex-col h-[calc(280px-4rem)]">
        <div className="flex-1 overflow-hidden">
          <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {work.tenTacPham}
          </h3>
          
          <div className="space-y-1.5 text-xs mb-3">
            <div className="flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-mono truncate">{work.code}</span>
            </div>
            
            <div className="flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 truncate">{work.tacGia}</span>
            </div>
            
            <div className="flex items-center">
              <Link2 className="w-3.5 h-3.5 mr-1 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <div className="text-blue-600 dark:text-blue-400 truncate">
                <div className="font-medium">{work.tenKenh}</div>
                <div className="text-xs font-mono opacity-75">{work.idKenh}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-400 text-xs">
                {formatDate(work.ngayBatDau)} - {formatDate(work.ngayKetThuc)}
              </span>
            </div>
            
            {work.thoiLuong && (
              <div className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                <span className="text-slate-600 dark:text-slate-400 text-xs">{work.thoiLuong}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Doanh thu</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {formatCurrency(work.totalRevenue)}
              </p>
            </div>
            
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewWork(work);
                }}
                title="Xem chi tiết"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button 
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                onClick={(e) => handleEditWork(work, e)}
                title="Chỉnh sửa"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button 
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                onClick={(e) => handleDeleteWork(work, e)}
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
    console.log('Loading more works...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Quản lý Tác phẩm</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">Quản lý thông tin tác phẩm âm nhạc</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative group">
            <Button 
              variant="success" 
              icon={Download}
            >
              Xuất Excel
            </Button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button 
                onClick={() => handleExport('csv')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t-lg text-slate-900 dark:text-white"
              >
                Xuất CSV
              </button>
              <button 
                onClick={() => handleExport('excel')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
              >
                Xuất Excel
              </button>
              <button 
                onClick={() => handleExport('pdf')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 rounded-b-lg text-slate-900 dark:text-white"
              >
                Xuất PDF
              </button>
            </div>
          </div>
          <Button 
            variant="primary" 
            icon={Plus}
            onClick={handleAddWork}
          >
            Thêm tác phẩm mới
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
                    placeholder="Tìm kiếm theo tên tác phẩm, code, tác giả..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Đã ký">Đã ký</option>
                  <option value="Tái ký">Tái ký</option>
                  <option value="Ký mới">Ký mới</option>
                  <option value="Khảo sát">Khảo sát</option>
                  <option value="Đàm phán">Đàm phán</option>
                </select>

                <select 
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">Tất cả hình thức</option>
                  <option value="Video">Video</option>
                  <option value="Audio">Audio</option>
                  <option value="Mv Karaoke">MV Karaoke</option>
                  <option value="VIDEO">VIDEO</option>
                </select>
                
                <div className="flex space-x-2 border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                  <button 
                    className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                    onClick={() => setViewMode('grid')}
                    title="Xem dạng lưới"
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button 
                    className={`px-3 py-2 ${viewMode === 'table' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Doanh thu tối thiểu
                  </label>
                  <input
                    type="number"
                    value={filters.minRevenue}
                    onChange={(e) => setFilters(prev => ({ ...prev, minRevenue: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Doanh thu tối đa
                  </label>
                  <input
                    type="number"
                    value={filters.maxRevenue}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxRevenue: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="10000000"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
        <span>Tìm thấy {filteredAndSortedWorks.length} tác phẩm</span>
        <div className="flex items-center space-x-2">
          <span>Sắp xếp theo:</span>
          <select 
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSortField(field as keyof Work);
              setSortDirection(direction as 'asc' | 'desc');
            }}
            className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="tenTacPham-asc">Tên tác phẩm (A-Z)</option>
            <option value="tenTacPham-desc">Tên tác phẩm (Z-A)</option>
            <option value="totalRevenue-desc">Doanh thu (Cao-Thấp)</option>
            <option value="totalRevenue-asc">Doanh thu (Thấp-Cao)</option>
            <option value="totalContracts-desc">Hợp đồng (Nhiều-Ít)</option>
            <option value="totalContracts-asc">Hợp đồng (Ít-Nhiều)</option>
          </select>
        </div>
      </div>

      {/* Works Grid View with Infinite Scroll */}
      {viewMode === 'grid' && (
        <div className="min-h-[500px]">
          <InfiniteScroll
            items={filteredAndSortedWorks}
            renderItem={renderWorkCard}
            loadMore={handleLoadMore}
            hasMore={true}
            loading={loading}
            itemsPerLoad={24}
            className="min-h-[500px]"
          />
        </div>
      )}

      {/* Works Table View */}
      {viewMode === 'table' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => handleSort('tenTacPham')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tác phẩm</span>
                      {getSortIcon('tenTacPham')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => handleSort('tacGia')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tác giả</span>
                      {getSortIcon('tacGia')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Kênh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => handleSort('totalContracts')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Hợp đồng</span>
                      {getSortIcon('totalContracts')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => handleSort('totalRevenue')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Doanh thu</span>
                      {getSortIcon('totalRevenue')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredAndSortedWorks.map((work) => (
                  <tr key={work.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => handleViewWork(work)}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{work.tenTacPham}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{work.code}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{work.hinhThuc}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-slate-900 dark:text-white">{work.tacGia}</div>
                        {work.tacGiaNhac && work.tacGiaNhac !== work.tacGia && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">Nhạc: {work.tacGiaNhac}</div>
                        )}
                        {work.tacGiaLoi && work.tacGiaLoi !== work.tacGia && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">Lời: {work.tacGiaLoi}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{work.tenKenh}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{work.idKenh}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <div>{formatDate(work.ngayBatDau)}</div>
                        <div>đến {formatDate(work.ngayKetThuc)}</div>
                        {work.thoiLuong && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">{work.thoiLuong}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{work.totalContracts}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">hợp đồng</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                      {formatCurrency(work.totalRevenue)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewWork(work);
                          }}
                          className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditWork(work, e);
                          }}
                          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWork(work, e);
                          }}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded"
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

      {/* Work Detail Modal */}
      {selectedWork && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Chi tiết tác phẩm"
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Thông tin tác phẩm</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tên tác phẩm</p>
                  <p className="text-base font-medium text-slate-900 dark:text-white">{selectedWork.tenTacPham}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Code</p>
                  <p className="text-base font-mono text-slate-900 dark:text-white">{selectedWork.code}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tác giả</p>
                  <p className="text-base text-slate-900 dark:text-white">{selectedWork.tacGia}</p>
                </div>
                
                {selectedWork.tacGiaNhac && (
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tác giả nhạc</p>
                    <p className="text-base text-slate-900 dark:text-white">{selectedWork.tacGiaNhac}</p>
                  </div>
                )}
                
                {selectedWork.tacGiaLoi && (
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tác giả lời</p>
                    <p className="text-base text-slate-900 dark:text-white">{selectedWork.tacGiaLoi}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Hình thức</p>
                  <p className="text-base text-slate-900 dark:text-white">{selectedWork.hinhThuc}</p>
                </div>
                
                {selectedWork.thoiLuong && (
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Thời lượng</p>
                    <p className="text-base text-slate-900 dark:text-white">{selectedWork.thoiLuong}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Thống kê</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Số hợp đồng</p>
                  <p className="text-base font-medium text-slate-900 dark:text-white">{selectedWork.totalContracts}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tổng doanh thu</p>
                  <p className="text-base font-medium text-slate-900 dark:text-white">{formatCurrency(selectedWork.totalRevenue)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Thời gian hiệu lực</p>
                  <p className="text-base text-slate-900 dark:text-white">
                    {formatDate(selectedWork.ngayBatDau)} - {formatDate(selectedWork.ngayKetThuc)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Kênh phân phối</p>
                  <p className="text-base text-blue-600 dark:text-blue-400 font-medium">{selectedWork.tenKenh}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{selectedWork.idKenh}</p>
                </div>
              </div>
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
          <p className="text-slate-700 dark:text-slate-300">
            Bạn có chắc chắn muốn xóa tác phẩm <span className="font-semibold">{selectedWork?.tenTacPham}</span>?
          </p>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
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

      {/* Add/Edit Work Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={isEditMode ? "Chỉnh sửa tác phẩm" : "Thêm tác phẩm mới"}
        size="lg"
      >
        <div className="py-4">
          <form className="space-y-4" onSubmit={handleFormSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tên tác phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tenTacPham"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                defaultValue={selectedWork?.tenTacPham || ''}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  defaultValue={selectedWork?.code || ''}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hình thức <span className="text-red-500">*</span>
                </label>
                <select
                  name="hinhThuc"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  defaultValue={selectedWork?.hinhThuc || ''}
                  required
                >
                  <option value="">-- Chọn hình thức --</option>
                  <option value="Video">Video</option>
                  <option value="Audio">Audio</option>
                  <option value="Mv Karaoke">MV Karaoke</option>
                  <option value="VIDEO">VIDEO</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tên kênh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="tenKenh"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  defaultValue={selectedWork?.tenKenh || ''}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ID Kênh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="idKenh"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  defaultValue={selectedWork?.idKenh || ''}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tác giả <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="tacGia"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  defaultValue={selectedWork?.tacGia || ''}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tác giả nhạc
                </label>
                <input
                  type="text"
                  name="tacGiaNhac"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  defaultValue={selectedWork?.tacGiaNhac || ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tác giả lời
                </label>
                <input
                  type="text"
                  name="tacGiaLoi"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  defaultValue={selectedWork?.tacGiaLoi || ''}
                />
              </div>
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

export default Works;
          {work.tenTacPham}
        </h3>
        
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 mb-3">
          <div className="flex items-center">
            <User className="w-3 h-3 mr-1 text-slate-400 dark:text-slate-500" />
            <span className="truncate">{work.tacGia}</span>
          </div>
          
          <div className="flex items-center">
            <FileText className="w-3 h-3 mr-1 text-slate-400 dark:text-slate-500" />
            <span className="truncate font-mono">{work.code}</span>
          </div>
          
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1 text-slate-400 dark:text-slate-500" />
            <span>{formatDate(work.ngayBatDau)} - {formatDate(work.ngayKetThuc)}</span>
          </div>
          
          {work.thoiLuong && (
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1 text-slate-400 dark:text-slate-500" />
              <span>{work.thoiLuong}</span>
            </div>
          )}
        </div>
        
        <div className="card-footer">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hợp đồng</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{work.totalContracts}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Doanh thu</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {formatCurrency(work.totalRevenue)}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              onClick={(e) => handleEditWork(work, e)}
              title="Chỉnh sửa"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button 
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              onClick={(e) => handleDeleteWork(work, e)}
              title="Xóa"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const handleLoadMore = () => {
    console.log('Loading more works...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Quản lý Tác phẩm</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">Quản lý thông tin tác phẩm âm nhạc</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative group">
            <Button 
              variant="success" 
              icon={Download}
            >
              Xuất Excel
            </Button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button 
                onClick={() => handleExport('csv')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t-lg text-slate-900 dark:text-white"
              >
                Xuất CSV
              </button>
              <button 
                onClick={() => handleExport('excel')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
              >
                Xuất Excel
              </button>
              <button 
                onClick={() => handleExport('pdf')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 rounded-b-lg text-slate-900 dark:text-white"
              >
                Xuất PDF
              </button>
            </div>
          </div>
          <Button 
            variant="primary" 
            icon={Plus}
            onClick={handleAddWork}
          >
            Thêm tác phẩm mới
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
                    placeholder="Tìm kiếm theo tên tác phẩm, code, tác giả..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Đã ký">Đã ký</option>
                  <option value="Tái ký">Tái ký</option>
                  <option value="Ký mới">Ký mới</option>
                  <option value="Khảo sát">Khảo sát</option>
                  <option value="Đàm phán">Đàm phán</option>
                </select>

                <select 
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">Tất cả hình thức</option>
                  <option value="Video">Video</option>
                  <option value="Audio">Audio</option>
                  <option value="Mv Karaoke">MV Karaoke</option>
                  <option value="VIDEO">VIDEO</option>
                </select>
                
                <div className="flex space-x-2 border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                  <button 
                    className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                    onClick={() => setViewMode('grid')}
                    title="Xem dạng lưới"
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button 
                    className={`px-3 py-2 ${viewMode === 'table' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Doanh thu tối thiểu
                  </label>
                  <input
                    type="number"
                    value={filters.minRevenue}
                    onChange={(e) => setFilters(prev => ({ ...prev, minRevenue: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Doanh thu tối đa
                  </label>
                  <input
                    type="number"
                    value={filters.maxRevenue}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxRevenue: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="10000000"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
        <span>Tìm thấy {filteredAndSortedWorks.length} tác phẩm</span>
        <div className="flex items-center space-x-2">
          <span>Sắp xếp theo:</span>
          <select 
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSortField(field as keyof Work);
              setSortDirection(direction as 'asc' | 'desc');
            }}
            className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="tenTacPham-asc">Tên tác phẩm (A-Z)</option>
            <option value="tenTacPham-desc">Tên tác phẩm (Z-A)</option>
            <option value="totalRevenue-desc">Doanh thu (Cao-Thấp)</option>
            <option value="totalRevenue-asc">Doanh thu (Thấp-Cao)</option>
            <option value="totalContracts-desc">Hợp đồng (Nhiều-Ít)</option>
            <option value="totalContracts-asc">Hợp đồng (Ít-Nhiều)</option>
          </select>
        </div>
      </div>

      {/* Works Grid View with Infinite Scroll */}
      {viewMode === 'grid' && (
        <div className="min-h-[500px]">
          <InfiniteScroll
            items={filteredAndSortedWorks}
            renderItem={renderWorkCard}
            loadMore={handleLoadMore}
            hasMore={true}
            loading={loading}
            itemsPerLoad={24}
            className="min-h-[500px]"
          />
        </div>
      )}

      {/* Works Table View */}
      {viewMode === 'table' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => handleSort('tenTacPham')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tác phẩm</span>
                      {getSortIcon('tenTacPham')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => handleSort('tacGia')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tác giả</span>
                      {getSortIcon('tacGia')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => handleSort('totalContracts')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Hợp đồng</span>
                      {getSortIcon('totalContracts')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => handleSort('totalRevenue')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Doanh thu</span>
                      {getSortIcon('totalRevenue')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredAndSortedWorks.map((work) => (
                  <tr key={work.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => handleViewWork(work)}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{work.tenTacPham}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{work.hinhThuc}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-slate-900 dark:text-white">{work.tacGia}</div>
                        {work.tacGiaNhac && work.tacGiaNhac !== work.tacGia && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">Nhạc: {work.tacGiaNhac}</div>
                        )}
                        {work.tacGiaLoi && work.tacGiaLoi !== work.tacGia && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">Lời: {work.tacGiaLoi}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-900 dark:text-white">{work.code}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <div>{formatDate(work.ngayBatDau)}</div>
                        <div>đến {formatDate(work.ngayKetThuc)}</div>
                        {work.thoiLuong && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">{work.thoiLuong}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{work.totalContracts}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">hợp đồng</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                      {formatCurrency(work.totalRevenue)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewWork(work);
                          }}
                          className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditWork(work, e);
                          }}
                          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWork(work, e);
                          }}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded"
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

      {/* Work Detail Modal */}
      {selectedWork && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Chi tiết tác phẩm"
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Thông tin tác phẩm</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tên tác phẩm</p>
                  <p className="text-base font-medium text-slate-900 dark:text-white">{selectedWork.tenTacPham}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Code</p>
                  <p className="text-base font-mono text-slate-900 dark:text-white">{selectedWork.code}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tác giả</p>
                  <p className="text-base text-slate-900 dark:text-white">{selectedWork.tacGia}</p>
                </div>
                
                {selectedWork.tacGiaNhac && (
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tác giả nhạc</p>
                    <p className="text-base text-slate-900 dark:text-white">{selectedWork.tacGiaNhac}</p>
                  </div>
                )}
                
                {selectedWork.tacGiaLoi && (
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tác giả lời</p>
                    <p className="text-base text-slate-900 dark:text-white">{selectedWork.tacGiaLoi}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Hình thức</p>
                  <p className="text-base text-slate-900 dark:text-white">{selectedWork.hinhThuc}</p>
                </div>
                
                {selectedWork.thoiLuong && (
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Thời lượng</p>
                    <p className="text-base text-slate-900 dark:text-white">{selectedWork.thoiLuong}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Thống kê</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Số hợp đồng</p>
                  <p className="text-base font-medium text-slate-900 dark:text-white">{selectedWork.totalContracts}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tổng doanh thu</p>
                  <p className="text-base font-medium text-slate-900 dark:text-white">{formatCurrency(selectedWork.totalRevenue)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Thời gian hiệu lực</p>
                  <p className="text-base text-slate-900 dark:text-white">
                    {formatDate(selectedWork.ngayBatDau)} - {formatDate(selectedWork.ngayKetThuc)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Kênh phân phối</p>
                  <p className="text-base text-slate-900 dark:text-white">{selectedWork.tenKenh}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{selectedWork.idKenh}</p>
                </div>
              </div>
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
          <p className="text-slate-700 dark:text-slate-300">
            Bạn có chắc chắn muốn xóa tác phẩm <span className="font-semibold">{selectedWork?.tenTacPham}</span>?
          </p>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
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

      {/* Add/Edit Work Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={isEditMode ? "Chỉnh sửa tác phẩm" : "Thêm tác phẩm mới"}
        size="lg"
      >
        <div className="py-4">
          <form className="space-y-4" onSubmit={handleFormSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tên tác phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tenTacPham"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                defaultValue={selectedWork?.tenTacPham || ''}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  defaultValue={selectedWork?.code || ''}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hình thức <span className="text-red-500">*</span>
                </label>
                <select
                  name="hinhThuc"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  defaultValue={selectedWork?.hinhThuc || ''}
                  required
                >
                  <option value="">-- Chọn hình thức --</option>
                  <option value="Video">Video</option>
                  <option value="Audio">Audio</option>
                  <option value="Mv Karaoke">MV Karaoke</option>
                  <option value="VIDEO">VIDEO</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tác giả <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="tacGia"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  defaultValue={selectedWork?.tacGia || ''}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tác giả nhạc
                </label>
                <input
                  type="text"
                  name="tacGiaNhac"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  defaultValue={selectedWork?.tacGiaNhac || ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tác giả lời
                </label>
                <input
                  type="text"
                  name="tacGiaLoi"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  defaultValue={selectedWork?.tacGiaLoi || ''}
                />
              </div>
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

export default Works;