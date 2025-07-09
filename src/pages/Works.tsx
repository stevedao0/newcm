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
  Building2,
  Calendar,
  DollarSign,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  Play,
  Video,
  Headphones,
  FileText,
  Link2,
  Code
} from 'lucide-react';
import { contractsData } from '../data/contracts';
import { Contract, Work } from '../types/contract';
import Button from '../components/ui/Button';
import Card, { CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import InfiniteScroll from '../components/ui/InfiniteScroll';
import { useNotifications } from '../contexts/NotificationContext';
import { db } from '../services/database';
import { formatCurrency, formatDate } from '../utils/formatUtils';
import { exportWorks } from '../utils/exportUtils';
import toast from 'react-hot-toast';

const Works: React.FC = () => {
  const [works, setWorks] = useState<Work[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
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
        // Generate works from contracts data
        const worksFromContracts = generateWorksFromContracts(contractsData);
        await Promise.all(worksFromContracts.map(work => db.create('works', work)));
        dbWorks = db.getAll('works');
      }
      
      console.log('Loaded works:', dbWorks.length);
      setWorks(dbWorks);
    } catch (error) {
      console.error('Error loading works:', error);
      const worksFromContracts = generateWorksFromContracts(contractsData);
      setWorks(worksFromContracts);
    } finally {
      setLoading(false);
    }
  };

  const generateWorksFromContracts = (contracts: Contract[]): Work[] => {
    const worksMap = new Map<string, Work>();
    
    contracts.forEach(contract => {
      if (!contract.code || !contract.tenTacPham) return;
      
      const key = contract.code;
      
      if (!worksMap.has(key)) {
        worksMap.set(key, {
          id: `work-${contract.id}`,
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
        
        const matchesFormat = formatFilter === 'all' || work.hinhThuc === formatFilter;
        const matchesStatus = statusFilter === 'all' || work.tinhTrang === statusFilter;
        
        const matchesFilters = 
          (!filters.startDate || new Date(work.ngayBatDau.split('/').reverse().join('-')) >= new Date(filters.startDate)) &&
          (!filters.endDate || new Date(work.ngayKetThuc.split('/').reverse().join('-')) <= new Date(filters.endDate)) &&
          (!filters.minRevenue || work.totalRevenue >= parseInt(filters.minRevenue)) &&
          (!filters.maxRevenue || work.totalRevenue <= parseInt(filters.maxRevenue));

        return matchesSearch && matchesFormat && matchesStatus && matchesFilters;
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
  }, [works, searchTerm, formatFilter, statusFilter, filters, sortField, sortDirection]);

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

  const getFormatIcon = (format: string) => {
    if (format.toLowerCase().includes('video')) {
      return <Video className="w-6 h-6 text-white opacity-80" />;
    } else if (format.toLowerCase().includes('audio')) {
      return <Headphones className="w-6 h-6 text-white opacity-80" />;
    } else {
      return <Music className="w-6 h-6 text-white opacity-80" />;
    }
  };

  const getFormatColor = (format: string) => {
    if (format.toLowerCase().includes('video')) {
      return 'from-purple-500 to-purple-600';
    } else if (format.toLowerCase().includes('audio')) {
      return 'from-green-500 to-green-600';
    } else if (format.toLowerCase().includes('karaoke')) {
      return 'from-blue-500 to-blue-600';
    } else {
      return 'from-orange-500 to-orange-600';
    }
  };

  const renderWorkCard = (work: Work, index: number) => (
    <div 
      className="card-uniform bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group hover-lift h-[280px]"
      onClick={() => handleViewWork(work)}
    >
      <div className={`card-header h-16 bg-gradient-to-br ${getFormatColor(work.hinhThuc)} relative flex items-center justify-center p-2`}>
        {getFormatIcon(work.hinhThuc)}
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
        <div className="absolute bottom-2 left-2 text-white text-xs">
          {work.hinhThuc}
        </div>
      </div>
      
      <div className="card-content p-3 flex flex-col h-[calc(280px-4rem)]">
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center mb-1.5">
            <Music className="w-3.5 h-3.5 mr-1 text-slate-500 flex-shrink-0" />
            <div className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors">
              {work.tenTacPham}
            </div>
          </div>
          
          <div className="flex items-center mb-1.5">
            <Code className="w-3.5 h-3.5 mr-1 text-slate-500 flex-shrink-0" />
            <span className="text-xs text-slate-600 font-mono">{work.code}</span>
          </div>
          
          <div className="flex items-center mb-1.5">
            <User className="w-3.5 h-3.5 mr-1 text-slate-500 flex-shrink-0" />
            <div className="text-xs text-slate-600 line-clamp-1">
              {work.tacGia}
              {(work.tacGiaNhac || work.tacGiaLoi) && (
                <span className="text-xs text-slate-500">
                  {work.tacGiaNhac && ` (Nhạc: ${work.tacGiaNhac})`}
                  {work.tacGiaLoi && ` (Lời: ${work.tacGiaLoi})`}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center mb-1.5">
            <FileText className="w-3.5 h-3.5 mr-1 text-slate-500 flex-shrink-0" />
            <span className="text-xs text-slate-600">
              {work.soHopDong}
              {work.soPhuLuc && <span className="ml-1">({work.soPhuLuc})</span>}
            </span>
          </div>
          
          <div className="flex items-center mb-1.5">
            <Link2 className="w-3.5 h-3.5 mr-1 text-slate-500 flex-shrink-0" />
            <a 
              href={`https://youtube.com/channel/${work.idKenh}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-600 hover:underline truncate"
            >
              {work.tenKenh} ({work.idKenh})
            </a>
          </div>
          
          <div className="flex items-center mb-1.5">
            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500 flex-shrink-0" />
            <span className="text-xs text-slate-600">
              {formatDate(work.ngayBatDau)} - {formatDate(work.ngayKetThuc)}
            </span>
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Nhuận bút</p>
              <p className="text-sm font-medium text-slate-900">
                {formatCurrency(work.mucNhuanBut)}
              </p>
            </div>
            
            <div className="flex space-x-1">
              <button 
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewWork(work);
                }}
                title="Xem chi tiết"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button 
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                onClick={(e) => handleEditWork(work, e)}
                title="Chỉnh sửa"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button 
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
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
    // This function will be called by InfiniteScroll when the user scrolls to the bottom
    // In this implementation, we're already loading all filtered items at once
    // But we keep this function for future pagination implementation
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý Tác phẩm</h1>
          <p className="text-slate-600 mt-1">Quản lý thư viện tác phẩm âm nhạc</p>
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
            onClick={handleAddWork}
          >
            Thêm tác phẩm
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
                    placeholder="Tìm kiếm tác phẩm, tác giả, số hợp đồng, kênh..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select 
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả hình thức</option>
                  <option value="Video">Video</option>
                  <option value="Audio">Audio</option>
                  <option value="Mv Karaoke">MV Karaoke</option>
                  <option value="Midi Karaoke">Midi Karaoke</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Teaser">Teaser</option>
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
                    Doanh thu tối thiểu
                  </label>
                  <input
                    type="number"
                    value={filters.minRevenue}
                    onChange={(e) => setFilters(prev => ({ ...prev, minRevenue: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Doanh thu tối đa
                  </label>
                  <input
                    type="number"
                    value={filters.maxRevenue}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxRevenue: e.target.value }))}
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
            className="px-2 py-1 border border-slate-300 rounded text-sm"
          >
            <option value="tenTacPham-asc">Tên tác phẩm (A-Z)</option>
            <option value="tenTacPham-desc">Tên tác phẩm (Z-A)</option>
            <option value="tacGia-asc">Tác giả (A-Z)</option>
            <option value="tacGia-desc">Tác giả (Z-A)</option>
            <option value="totalRevenue-desc">Doanh thu (Cao-Thấp)</option>
            <option value="totalRevenue-asc">Doanh thu (Thấp-Cao)</option>
            <option value="ngayKetThuc-desc">Ngày kết thúc (Mới-Cũ)</option>
            <option value="ngayKetThuc-asc">Ngày kết thúc (Cũ-Mới)</option>
            <option value="code-asc">Code (A-Z)</option>
            <option value="code-desc">Code (Z-A)</option>
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
            hasMore={true} // Set to true to enable infinite scroll
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
              <thead className="bg-slate-50">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('tenTacPham')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tác phẩm</span>
                      {getSortIcon('tenTacPham')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('tacGia')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tác giả</span>
                      {getSortIcon('tacGia')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('soHopDong')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Hợp đồng</span>
                      {getSortIcon('soHopDong')}
                    </div>
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
                    onClick={() => handleSort('ngayBatDau')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Thời gian</span>
                      {getSortIcon('ngayBatDau')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('hinhThuc')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Hình thức</span>
                      {getSortIcon('hinhThuc')}
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
                {filteredAndSortedWorks.map((work) => (
                  <tr key={work.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewWork(work)}>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{work.tenTacPham}</div>
                        <div className="text-xs text-slate-500 font-mono">Code: {work.code}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm text-slate-900">{work.tacGia}</div>
                        {(work.tacGiaNhac || work.tacGiaLoi) && (
                          <div className="text-xs text-slate-500">
                            {work.tacGiaNhac && `Nhạc: ${work.tacGiaNhac}`}
                            {work.tacGiaNhac && work.tacGiaLoi && ' | '}
                            {work.tacGiaLoi && `Lời: ${work.tacGiaLoi}`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm text-slate-900">{work.soHopDong}</div>
                        {work.soPhuLuc && (
                          <div className="text-xs text-slate-500">Phụ lục: {work.soPhuLuc}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm text-slate-900">{work.tenKenh}</div>
                        <a 
                          href={`https://youtube.com/channel/${work.idKenh}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-600 hover:underline font-mono"
                        >
                          {work.idKenh}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-600">
                        <div>{formatDate(work.ngayBatDau)}</div>
                        <div>{formatDate(work.ngayKetThuc)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800">
                        {work.hinhThuc}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {formatCurrency(work.mucNhuanBut)}
                        </div>
                        <div className="text-xs text-slate-500">{work.totalContracts} hợp đồng</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        work.tinhTrang === 'Đã ký' ? 'bg-green-100 text-green-800' :
                        work.tinhTrang === 'Tái ký' ? 'bg-blue-100 text-blue-800' :
                        work.tinhTrang === 'Ký mới' ? 'bg-yellow-100 text-yellow-800' :
                        work.tinhTrang === 'Khảo sát' ? 'bg-purple-100 text-purple-800' :
                        work.tinhTrang === 'Đàm phán' ? 'bg-orange-100 text-orange-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {work.tinhTrang}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewWork(work);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditWork(work, e);
                          }}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWork(work, e);
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

      {/* Work Detail Modal */}
      {selectedWork && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Chi tiết tác phẩm"
          size="xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Thông tin tác phẩm</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Tên tác phẩm</p>
                  <p className="text-base font-medium">{selectedWork.tenTacPham}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Code</p>
                  <p className="text-base font-mono">{selectedWork.code}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Tác giả</p>
                  <p className="text-base">{selectedWork.tacGia}</p>
                </div>
                
                {selectedWork.tacGiaNhac && (
                  <div>
                    <p className="text-sm text-slate-500">Tác giả nhạc</p>
                    <p className="text-base">{selectedWork.tacGiaNhac}</p>
                  </div>
                )}
                
                {selectedWork.tacGiaLoi && (
                  <div>
                    <p className="text-sm text-slate-500">Tác giả lời</p>
                    <p className="text-base">{selectedWork.tacGiaLoi}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-slate-500">Hình thức</p>
                  <p className="text-base">{selectedWork.hinhThuc}</p>
                </div>
                
                {selectedWork.thoiLuong && (
                  <div>
                    <p className="text-sm text-slate-500">Thời lượng</p>
                    <p className="text-base">{selectedWork.thoiLuong}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Thông tin hợp đồng</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Số hợp đồng</p>
                  <p className="text-base">{selectedWork.soHopDong}</p>
                </div>
                
                {selectedWork.soPhuLuc && (
                  <div>
                    <p className="text-sm text-slate-500">Số phụ lục</p>
                    <p className="text-base">{selectedWork.soPhuLuc}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-slate-500">Kênh (ID kênh)</p>
                  <p className="text-base">{selectedWork.tenKenh}</p>
                  <p className="text-xs text-slate-500 font-mono">
                    <a 
                      href={`https://youtube.com/channel/${selectedWork.idKenh}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {selectedWork.idKenh}
                    </a>
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Thời gian hiệu lực</p>
                  <p className="text-base">{formatDate(selectedWork.ngayBatDau)} - {formatDate(selectedWork.ngayKetThuc)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Tình trạng</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    selectedWork.tinhTrang === 'Đã ký' ? 'bg-green-100 text-green-800' :
                    selectedWork.tinhTrang === 'Tái ký' ? 'bg-blue-100 text-blue-800' :
                    selectedWork.tinhTrang === 'Ký mới' ? 'bg-yellow-100 text-yellow-800' :
                    selectedWork.tinhTrang === 'Khảo sát' ? 'bg-purple-100 text-purple-800' :
                    selectedWork.tinhTrang === 'Đàm phán' ? 'bg-orange-100 text-orange-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {selectedWork.tinhTrang}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Mức nhuận bút</p>
                  <p className="text-base font-medium">{formatCurrency(selectedWork.mucNhuanBut)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Tổng số hợp đồng</p>
                  <p className="text-base font-medium">{selectedWork.totalContracts}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Tổng doanh thu</p>
                  <p className="text-base font-medium">{formatCurrency(selectedWork.totalRevenue)}</p>
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
          <p className="text-slate-700">
            Bạn có chắc chắn muốn xóa tác phẩm <span className="font-semibold">{selectedWork?.tenTacPham}</span>?
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

      {/* Add/Edit Work Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={isEditMode ? "Chỉnh sửa tác phẩm" : "Thêm tác phẩm mới"}
        size="xl"
      >
        <div className="py-4">
          <form className="space-y-6" onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên tác phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="tenTacPham"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedWork?.tenTacPham || ''}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedWork?.code || ''}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tác giả <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="tacGia"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedWork?.tacGia || ''}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tác giả nhạc
                </label>
                <input
                  type="text"
                  name="tacGiaNhac"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedWork?.tacGiaNhac || ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tác giả lời
                </label>
                <input
                  type="text"
                  name="tacGiaLoi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedWork?.tacGiaLoi || ''}
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
                  defaultValue={selectedWork?.soHopDong || ''}
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
                  defaultValue={selectedWork?.soPhuLuc || ''}
                />
              </div>
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
                  defaultValue={selectedWork?.idKenh || ''}
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
                  defaultValue={selectedWork?.tenKenh || ''}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="ngayBatDau"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedWork?.ngayBatDau ? selectedWork.ngayBatDau.split('/').reverse().join('-') : ''}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="ngayKetThuc"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedWork?.ngayKetThuc ? selectedWork.ngayKetThuc.split('/').reverse().join('-') : ''}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hình thức <span className="text-red-500">*</span>
                </label>
                <select
                  name="hinhThuc"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedWork?.hinhThuc || ''}
                  required
                >
                  <option value="">-- Chọn hình thức --</option>
                  <option value="Video">Video</option>
                  <option value="Audio">Audio</option>
                  <option value="Mv Karaoke">MV Karaoke</option>
                  <option value="Midi Karaoke">Midi Karaoke</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Teaser">Teaser</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Thời lượng
                </label>
                <input
                  type="text"
                  name="thoiLuong"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedWork?.thoiLuong || ''}
                  placeholder="00:03:30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tình trạng <span className="text-red-500">*</span>
                </label>
                <select
                  name="tinhTrang"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedWork?.tinhTrang || 'Đã ký'}
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
                defaultValue={selectedWork?.mucNhuanBut || ''}
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

export default Works;