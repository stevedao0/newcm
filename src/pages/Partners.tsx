import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Building2,
  Phone,
  Mail,
  Globe,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid,
  List
} from 'lucide-react';
import { partnersData } from '../data/partners';
import { Partner } from '../types/contract';
import Button from '../components/ui/Button';
import Card, { CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import InfiniteScroll from '../components/ui/InfiniteScroll';
import { useNotifications } from '../contexts/NotificationContext';
import { db } from '../services/database';
import { formatCurrency, formatNumber } from '../utils/formatUtils';
import { exportPartners } from '../utils/exportUtils';
import toast from 'react-hot-toast';

const Partners: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortField, setSortField] = useState<keyof Partner>('tenDonVi');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    minContracts: '',
    maxContracts: '',
    minRevenue: '',
    maxRevenue: ''
  });

  const { addNotification } = useNotifications();

  useEffect(() => {
    loadPartners();
    
    // Subscribe to database changes
    const unsubscribe = db.subscribe('partners', () => {
      console.log('Partners data changed, reloading...');
      loadPartners();
    });
    return unsubscribe;
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    try {
      let dbPartners = db.getAll('partners');
      
      if (dbPartners.length === 0) {
        console.log('No partners in database, initializing with sample data...');
        // Initialize with sample data
        const partnersWithIds = partnersData.map(partner => ({
          ...partner,
          id: partner.id || `partner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
        
        await Promise.all(partnersWithIds.map(partner => db.create('partners', partner)));
        dbPartners = db.getAll('partners');
      }
      
      console.log('Loaded partners:', dbPartners.length);
      setPartners(dbPartners);
    } catch (error) {
      console.error('Error loading partners:', error);
      setPartners(partnersData);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Partner) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Partner) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Memoized filtered and sorted partners
  const filteredAndSortedPartners = useMemo(() => {
    return partners
      .filter(partner => {
        const matchesSearch = 
          (partner.tenDonVi && partner.tenDonVi.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (partner.nguoiDaiDien && partner.nguoiDaiDien.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (partner.email && partner.email.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesFilters = 
          (!filters.minContracts || partner.soHopDongDaKy >= parseInt(filters.minContracts)) &&
          (!filters.maxContracts || partner.soHopDongDaKy <= parseInt(filters.maxContracts)) &&
          (!filters.minRevenue || partner.tongDoanhThu >= parseInt(filters.minRevenue)) &&
          (!filters.maxRevenue || partner.tongDoanhThu <= parseInt(filters.maxRevenue));

        return matchesSearch && matchesFilters;
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
  }, [partners, searchTerm, filters, sortField, sortDirection]);

  const handleViewPartner = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsDetailModalOpen(true);
  };

  const handleEditPartner = (partner: Partner, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPartner(partner);
    setIsEditMode(true);
    setIsFormModalOpen(true);
  };

  const handleDeletePartner = (partner: Partner, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPartner(partner);
    setIsDeleteModalOpen(true);
  };

  const handleAddPartner = () => {
    setSelectedPartner(null);
    setIsEditMode(false);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const partnerData = {
      tenDonVi: formData.get('tenDonVi') as string,
      diaChi: formData.get('diaChi') as string,
      nguoiDaiDien: formData.get('nguoiDaiDien') as string,
      soDienThoai: formData.get('soDienThoai') as string,
      email: formData.get('email') as string,
      website: formData.get('website') as string,
      soHopDongDaKy: parseInt(formData.get('soHopDongDaKy') as string) || 0,
      tongDoanhThu: parseInt(formData.get('tongDoanhThu') as string) || 0,
      ghiChu: formData.get('ghiChu') as string
    };

    try {
      if (isEditMode && selectedPartner) {
        await db.update('partners', selectedPartner.id, partnerData);
        toast.success('Cập nhật đối tác thành công!');
        addNotification({
          title: 'Đối tác được cập nhật',
          message: `Đối tác ${partnerData.tenDonVi} đã được cập nhật`,
          type: 'success'
        });
      } else {
        await db.create('partners', partnerData);
        toast.success('Thêm đối tác thành công!');
        addNotification({
          title: 'Đối tác mới',
          message: `Đối tác ${partnerData.tenDonVi} đã được thêm`,
          type: 'success'
        });
      }
      setIsFormModalOpen(false);
    } catch (error) {
      console.error('Error saving partner:', error);
      toast.error('Có lỗi xảy ra khi lưu đối tác');
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedPartner) {
      try {
        await db.delete('partners', selectedPartner.id);
        toast.success('Xóa đối tác thành công!');
        addNotification({
          title: 'Đối tác đã xóa',
          message: `Đối tác ${selectedPartner.tenDonVi} đã được xóa`,
          type: 'info'
        });
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error('Error deleting partner:', error);
        toast.error('Có lỗi xảy ra khi xóa đối tác');
      }
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const result = exportPartners(filteredAndSortedPartners, format);
      if (result.success) {
        toast.success(`Xuất ${format.toUpperCase()} thành công!`);
      } else {
        toast.error(`Lỗi xuất ${format.toUpperCase()}: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Có lỗi xảy ra khi xuất ${format.toUpperCase()}`);
    }
  };

  const renderPartnerCard = (partner: Partner, index: number) => (
    <div 
      className="card-uniform bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group hover-lift"
      onClick={() => handleViewPartner(partner)}
    >
      <div className="card-header bg-gradient-to-br from-blue-500 to-purple-600 relative flex items-center justify-center">
        <Building2 className="w-8 h-8 text-white opacity-80" />
        <div className="absolute top-2 right-2">
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-20 text-white">
            {partner.soHopDongDaKy} hợp đồng
          </span>
        </div>
      </div>
      
      <div className="card-content">
        <h3 className="card-title group-hover:text-blue-600 transition-colors">
          {partner.tenDonVi}
        </h3>
        
        <div className="card-details space-y-1">
          {partner.nguoiDaiDien && (
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1 text-slate-400" />
              <span className="truncate">{partner.nguoiDaiDien}</span>
            </div>
          )}
          
          {partner.soDienThoai && (
            <div className="flex items-center">
              <Phone className="w-3 h-3 mr-1 text-slate-400" />
              <span>{partner.soDienThoai}</span>
            </div>
          )}
          
          {partner.email && (
            <div className="flex items-center">
              <Mail className="w-3 h-3 mr-1 text-slate-400" />
              <span className="truncate">{partner.email}</span>
            </div>
          )}
          
          {partner.website && (
            <div className="flex items-center">
              <Globe className="w-3 h-3 mr-1 text-slate-400" />
              <span className="truncate">{partner.website}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <Building2 className="w-3 h-3 mr-1 text-slate-400" />
            <span className="truncate line-clamp-1">{partner.diaChi}</span>
          </div>
        </div>
        
        <div className="card-footer">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p className="text-xs text-slate-500">Hợp đồng</p>
              <p className="text-sm font-medium text-slate-900">{partner.soHopDongDaKy}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Doanh thu</p>
              <p className="text-sm font-medium text-slate-900">
                {formatCurrency(partner.tongDoanhThu)}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
              onClick={(e) => handleEditPartner(partner, e)}
              title="Chỉnh sửa"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button 
              className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
              onClick={(e) => handleDeletePartner(partner, e)}
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
    console.log('Loading more partners...');
    // This function will be called by InfiniteScroll when the user scrolls to the bottom
    // In this implementation, we're already loading all filtered items at once
    // But we keep this function for future pagination implementation
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Quản lý Đối tác</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Quản lý thông tin đối tác và đơn vị hợp tác</p>
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
            onClick={handleAddPartner}
          >
            Thêm đối tác mới
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
                    placeholder="Tìm kiếm theo tên đơn vị, người đại diện, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
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
                    Số hợp đồng tối thiểu
                  </label>
                  <input
                    type="number"
                    value={filters.minContracts}
                    onChange={(e) => setFilters(prev => ({ ...prev, minContracts: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Số hợp đồng tối đa
                  </label>
                  <input
                    type="number"
                    value={filters.maxContracts}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxContracts: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="100"
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
                    placeholder="1000000000"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Tìm thấy {filteredAndSortedPartners.length} đối tác</span>
        <div className="flex items-center space-x-2">
          <span>Sắp xếp theo:</span>
          <select 
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSortField(field as keyof Partner);
              setSortDirection(direction as 'asc' | 'desc');
            }}
            className="px-2 py-1 border border-slate-300 rounded text-sm"
          >
            <option value="tenDonVi-asc">Tên đơn vị (A-Z)</option>
            <option value="tenDonVi-desc">Tên đơn vị (Z-A)</option>
            <option value="tongDoanhThu-desc">Doanh thu (Cao-Thấp)</option>
            <option value="tongDoanhThu-asc">Doanh thu (Thấp-Cao)</option>
            <option value="soHopDongDaKy-desc">Hợp đồng (Nhiều-Ít)</option>
            <option value="soHopDongDaKy-asc">Hợp đồng (Ít-Nhiều)</option>
          </select>
        </div>
      </div>

      {/* Partners Grid View with Infinite Scroll */}
      {viewMode === 'grid' && (
        <div className="min-h-[500px]">
          <InfiniteScroll
            items={filteredAndSortedPartners}
            renderItem={renderPartnerCard}
            loadMore={handleLoadMore}
            hasMore={true} // Set to true to enable infinite scroll
            loading={loading}
            itemsPerLoad={24}
            className="min-h-[500px]"
          />
        </div>
      )}

      {/* Partners Table View */}
      {viewMode === 'table' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('tenDonVi')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tên đơn vị</span>
                      {getSortIcon('tenDonVi')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Liên hệ
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('soHopDongDaKy')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Hợp đồng</span>
                      {getSortIcon('soHopDongDaKy')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('tongDoanhThu')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Doanh thu</span>
                      {getSortIcon('tongDoanhThu')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredAndSortedPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewPartner(partner)}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{partner.tenDonVi}</div>
                        {partner.nguoiDaiDien && (
                          <div className="text-sm text-slate-500">
                            <User className="w-3 h-3 inline mr-1" />
                            {partner.nguoiDaiDien}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {partner.soDienThoai && (
                          <div className="flex items-center text-sm text-slate-600">
                            <Phone className="w-3 h-3 mr-1" />
                            {partner.soDienThoai}
                          </div>
                        )}
                        {partner.email && (
                          <div className="flex items-center text-sm text-slate-600">
                            <Mail className="w-3 h-3 mr-1" />
                            {partner.email}
                          </div>
                        )}
                        {partner.diaChi && (
                          <div className="flex items-center text-sm text-slate-600 line-clamp-1">
                            <Building2 className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{partner.diaChi}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-slate-900">{partner.soHopDongDaKy}</div>
                        <div className="text-xs text-slate-500">hợp đồng</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {formatCurrency(partner.tongDoanhThu)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPartner(partner);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPartner(partner, e);
                          }}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePartner(partner, e);
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

      {/* Partner Detail Modal */}
      {selectedPartner && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Chi tiết đối tác"
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Thông tin đối tác</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Tên đơn vị</p>
                  <p className="text-base font-medium">{selectedPartner.tenDonVi}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Địa chỉ</p>
                  <p className="text-base">{selectedPartner.diaChi}</p>
                </div>
                
                {selectedPartner.nguoiDaiDien && (
                  <div>
                    <p className="text-sm text-slate-500">Người đại diện</p>
                    <p className="text-base">{selectedPartner.nguoiDaiDien}</p>
                  </div>
                )}
                
                {selectedPartner.soDienThoai && (
                  <div>
                    <p className="text-sm text-slate-500">Số điện thoại</p>
                    <p className="text-base">{selectedPartner.soDienThoai}</p>
                  </div>
                )}
                
                {selectedPartner.email && (
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="text-base">{selectedPartner.email}</p>
                  </div>
                )}
                
                {selectedPartner.website && (
                  <div>
                    <p className="text-sm text-slate-500">Website</p>
                    <p className="text-base">{selectedPartner.website}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Thống kê</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Tổng số hợp đồng đã ký</p>
                  <p className="text-base font-medium">{selectedPartner.soHopDongDaKy}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Tổng doanh thu</p>
                  <p className="text-base font-medium">{formatCurrency(selectedPartner.tongDoanhThu)}</p>
                </div>
              </div>
              
              {selectedPartner.ghiChu && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Ghi chú</h3>
                  <p className="text-base">{selectedPartner.ghiChu}</p>
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
            Bạn có chắc chắn muốn xóa đối tác <span className="font-semibold">{selectedPartner?.tenDonVi}</span>?
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

      {/* Add/Edit Partner Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={isEditMode ? "Chỉnh sửa đối tác" : "Thêm đối tác mới"}
        size="lg"
      >
        <div className="py-4">
          <form className="space-y-4" onSubmit={handleFormSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tên đơn vị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tenDonVi"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={selectedPartner?.tenDonVi || ''}
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
                defaultValue={selectedPartner?.diaChi || ''}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Người đại diện
                </label>
                <input
                  type="text"
                  name="nguoiDaiDien"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedPartner?.nguoiDaiDien || ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="soDienThoai"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedPartner?.soDienThoai || ''}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedPartner?.email || ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedPartner?.website || ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Số hợp đồng đã ký
                </label>
                <input
                  type="number"
                  name="soHopDongDaKy"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedPartner?.soHopDongDaKy || 0}
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tổng doanh thu (VNĐ)
                </label>
                <input
                  type="number"
                  name="tongDoanhThu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedPartner?.tongDoanhThu || 0}
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ghi chú
              </label>
              <textarea
                name="ghiChu"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                defaultValue={selectedPartner?.ghiChu || ''}
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

export default Partners;