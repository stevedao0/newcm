import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Youtube,
  Facebook,
  Users,
  Play,
  Link2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid,
  List
} from 'lucide-react';
import { channelsData } from '../data/channels';
import { Channel } from '../types/contract';
import Button from '../components/ui/Button';
import Card, { CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import InfiniteScroll from '../components/ui/InfiniteScroll';
import { useNotifications } from '../contexts/NotificationContext';
import { db } from '../services/database';
import { formatNumber } from '../utils/formatUtils';
import { exportChannels } from '../utils/exportUtils';
import toast from 'react-hot-toast';

const Channels: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortField, setSortField] = useState<keyof Channel>('tenKenh');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    minSubscribers: '',
    maxSubscribers: '',
    minViews: '',
    maxViews: ''
  });

  const { addNotification } = useNotifications();

  useEffect(() => {
    loadChannels();
    
    // Subscribe to database changes
    const unsubscribe = db.subscribe('channels', () => {
      console.log('Channels data changed, reloading...');
      loadChannels();
    });
    return unsubscribe;
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    try {
      let dbChannels = db.getAll('channels');
      
      if (dbChannels.length === 0) {
        console.log('No channels in database, initializing with sample data...');
        // Initialize with sample data
        const channelsWithIds = channelsData.map(channel => ({
          ...channel,
          id: channel.id || `channel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
        
        await Promise.all(channelsWithIds.map(channel => db.create('channels', channel)));
        dbChannels = db.getAll('channels');
      }
      
      console.log('Loaded channels:', dbChannels.length);
      setChannels(dbChannels);
    } catch (error) {
      console.error('Error loading channels:', error);
      setChannels(channelsData);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Channel) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Channel) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Memoized filtered and sorted channels
  const filteredAndSortedChannels = useMemo(() => {
    return channels
      .filter(channel => {
        const matchesSearch = 
          (channel.tenKenh && channel.tenKenh.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (channel.idKenh && channel.idKenh.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (channel.nguoiPhuTrach && channel.nguoiPhuTrach.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesPlatform = platformFilter === 'all' || channel.platform === platformFilter;
        const matchesStatus = statusFilter === 'all' || channel.trangThai === statusFilter;
        
        const matchesFilters = 
          (!filters.minSubscribers || (channel.subscribers && channel.subscribers >= parseInt(filters.minSubscribers))) &&
          (!filters.maxSubscribers || (channel.subscribers && channel.subscribers <= parseInt(filters.maxSubscribers))) &&
          (!filters.minViews || (channel.views && channel.views >= parseInt(filters.minViews))) &&
          (!filters.maxViews || (channel.views && channel.views <= parseInt(filters.maxViews)));

        return matchesSearch && matchesPlatform && matchesStatus && matchesFilters;
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
  }, [channels, searchTerm, platformFilter, statusFilter, filters, sortField, sortDirection]);

  const handleViewChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setIsDetailModalOpen(true);
  };

  const handleEditChannel = (channel: Channel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedChannel(channel);
    setIsEditMode(true);
    setIsFormModalOpen(true);
  };

  const handleDeleteChannel = (channel: Channel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedChannel(channel);
    setIsDeleteModalOpen(true);
  };

  const handleAddChannel = () => {
    setSelectedChannel(null);
    setIsEditMode(false);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const channelData = {
      idKenh: formData.get('idKenh') as string,
      tenKenh: formData.get('tenKenh') as string,
      platform: formData.get('platform') as Channel['platform'],
      subscribers: parseInt(formData.get('subscribers') as string) || 0,
      views: parseInt(formData.get('views') as string) || 0,
      nguoiPhuTrach: formData.get('nguoiPhuTrach') as string,
      ngayTao: formData.get('ngayTao') as string,
      trangThai: formData.get('trangThai') as Channel['trangThai'],
      ghiChu: formData.get('ghiChu') as string
    };

    try {
      if (isEditMode && selectedChannel) {
        await db.update('channels', selectedChannel.id, channelData);
        toast.success('Cập nhật kênh thành công!');
        addNotification({
          title: 'Kênh được cập nhật',
          message: `Kênh ${channelData.tenKenh} đã được cập nhật`,
          type: 'success'
        });
      } else {
        await db.create('channels', channelData);
        toast.success('Thêm kênh thành công!');
        addNotification({
          title: 'Kênh mới',
          message: `Kênh ${channelData.tenKenh} đã được thêm`,
          type: 'success'
        });
      }
      setIsFormModalOpen(false);
    } catch (error) {
      console.error('Error saving channel:', error);
      toast.error('Có lỗi xảy ra khi lưu kênh');
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedChannel) {
      try {
        await db.delete('channels', selectedChannel.id);
        toast.success('Xóa kênh thành công!');
        addNotification({
          title: 'Kênh đã xóa',
          message: `Kênh ${selectedChannel.tenKenh} đã được xóa`,
          type: 'info'
        });
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error('Error deleting channel:', error);
        toast.error('Có lỗi xảy ra khi xóa kênh');
      }
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const result = exportChannels(filteredAndSortedChannels, format);
      if (result.success) {
        toast.success(`Xuất ${format.toUpperCase()} thành công!`);
      } else {
        toast.error(`Lỗi xuất ${format.toUpperCase()}: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Có lỗi xảy ra khi xuất ${format.toUpperCase()}`);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'YouTube':
        return <Youtube className="w-6 h-6 text-white opacity-80" />;
      case 'Facebook':
        return <Facebook className="w-6 h-6 text-white opacity-80" />;
      default:
        return <Link2 className="w-6 h-6 text-white opacity-80" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'YouTube':
        return 'from-red-500 to-red-600';
      case 'Facebook':
        return 'from-blue-500 to-blue-600';
      case 'TikTok':
        return 'from-black to-gray-800';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  const renderChannelCard = (channel: Channel, index: number) => (
    <div 
      className="card-uniform bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group hover-lift"
      onClick={() => handleViewChannel(channel)}
    >
      <div className={`card-header bg-gradient-to-br ${getPlatformColor(channel.platform)} relative flex items-center justify-center`}>
        {getPlatformIcon(channel.platform)}
        <div className="absolute top-2 right-2">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            channel.trangThai === 'Hoạt động' ? 'bg-green-100 bg-opacity-80 text-green-800' :
            channel.trangThai === 'Tạm ngưng' ? 'bg-amber-100 bg-opacity-80 text-amber-800' :
            'bg-red-100 bg-opacity-80 text-red-800'
          }`}>
            {channel.trangThai}
          </span>
        </div>
        <div className="absolute bottom-2 left-2 text-white text-xs">
          {channel.platform}
        </div>
      </div>
      
      <div className="card-content">
        <h3 className="card-title group-hover:text-blue-600 transition-colors">
          {channel.tenKenh}
        </h3>
        
        <div className="card-details space-y-1">
          <div className="flex items-center">
            <Link2 className="w-3 h-3 mr-1 text-slate-400" />
            <span className="truncate font-mono text-xs">{channel.idKenh}</span>
          </div>
          
          <div className="flex items-center">
            <Users className="w-3 h-3 mr-1 text-slate-400" />
            <span>{channel.nguoiPhuTrach}</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-xs text-slate-500">Tạo: {channel.ngayTao}</span>
          </div>
        </div>
        
        <div className="card-footer">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p className="text-xs text-slate-500">Người đăng ký</p>
              <p className="text-sm font-medium text-slate-900">
                {channel.subscribers ? formatNumber(channel.subscribers) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Lượt xem</p>
              <p className="text-sm font-medium text-slate-900">
                {channel.views ? formatNumber(channel.views) : 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                onClick={(e) => handleEditChannel(channel, e)}
                title="Chỉnh sửa"
              >
                <Edit className="w-3 h-3" />
              </button>
              <button 
                className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                onClick={(e) => handleDeleteChannel(channel, e)}
                title="Xóa"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button 
                className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (channel.platform === 'YouTube') {
                    window.open(`https://youtube.com/channel/${channel.idKenh}`, '_blank');
                  } else if (channel.platform === 'Facebook') {
                    window.open(`https://facebook.com/${channel.idKenh}`, '_blank');
                  }
                }}
                title="Xem kênh"
              >
                <Play className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleLoadMore = () => {
    console.log('Loading more channels...');
    // This function will be called by InfiniteScroll when the user scrolls to the bottom
    // In this implementation, we're already loading all filtered items at once
    // But we keep this function for future pagination implementation
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Quản lý Kênh</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Quản lý kênh phân phối nội dung</p>
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
            onClick={handleAddChannel}
          >
            Thêm kênh mới
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
                    placeholder="Tìm kiếm theo tên kênh, ID kênh, người phụ trách..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select 
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả nền tảng</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Facebook">Facebook</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Khác">Khác</option>
                </select>

                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Tạm ngưng">Tạm ngưng</option>
                  <option value="Đã xóa">Đã xóa</option>
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
                    Người đăng ký tối thiểu
                  </label>
                  <input
                    type="number"
                    value={filters.minSubscribers}
                    onChange={(e) => setFilters(prev => ({ ...prev, minSubscribers: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Người đăng ký tối đa
                  </label>
                  <input
                    type="number"
                    value={filters.maxSubscribers}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxSubscribers: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Lượt xem tối thiểu
                  </label>
                  <input
                    type="number"
                    value={filters.minViews}
                    onChange={(e) => setFilters(prev => ({ ...prev, minViews: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Lượt xem tối đa
                  </label>
                  <input
                    type="number"
                    value={filters.maxViews}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxViews: e.target.value }))}
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
        <span>Tìm thấy {filteredAndSortedChannels.length} kênh</span>
        <div className="flex items-center space-x-2">
          <span>Sắp xếp theo:</span>
          <select 
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSortField(field as keyof Channel);
              setSortDirection(direction as 'asc' | 'desc');
            }}
            className="px-2 py-1 border border-slate-300 rounded text-sm"
          >
            <option value="tenKenh-asc">Tên kênh (A-Z)</option>
            <option value="tenKenh-desc">Tên kênh (Z-A)</option>
            <option value="subscribers-desc">Người đăng ký (Nhiều-Ít)</option>
            <option value="subscribers-asc">Người đăng ký (Ít-Nhiều)</option>
            <option value="views-desc">Lượt xem (Nhiều-Ít)</option>
            <option value="views-asc">Lượt xem (Ít-Nhiều)</option>
            <option value="ngayTao-desc">Ngày tạo (Mới-Cũ)</option>
            <option value="ngayTao-asc">Ngày tạo (Cũ-Mới)</option>
          </select>
        </div>
      </div>

      {/* Channels Grid View with Infinite Scroll */}
      {viewMode === 'grid' && (
        <div className="min-h-[500px]">
          <InfiniteScroll
            items={filteredAndSortedChannels}
            renderItem={renderChannelCard}
            loadMore={handleLoadMore}
            hasMore={true} // Set to true to enable infinite scroll
            loading={loading}
            itemsPerLoad={24}
            className="min-h-[500px]"
          />
        </div>
      )}

      {/* Channels Table View */}
      {viewMode === 'table' && (
        <Card>
          <div 
            className="overflow-x-auto"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            <table className="w-full">
              <thead 
                style={{
                  backgroundColor: 'var(--bg-tertiary)'
                }}
              >
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                    style={{
                      color: 'var(--text-secondary)'
                    }}
                    onClick={() => handleSort('tenKenh')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Kênh</span>
                      {getSortIcon('tenKenh')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                    style={{
                      color: 'var(--text-secondary)'
                    }}
                    onClick={() => handleSort('platform')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nền tảng</span>
                      {getSortIcon('platform')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                    style={{
                      color: 'var(--text-secondary)'
                    }}
                    onClick={() => handleSort('nguoiPhuTrach')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Người phụ trách</span>
                      {getSortIcon('nguoiPhuTrach')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Thống kê
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                    style={{
                      color: 'var(--text-secondary)'
                    }}
                    onClick={() => handleSort('ngayTao')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Ngày tạo</span>
                      {getSortIcon('ngayTao')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                    style={{
                      color: 'var(--text-secondary)'
                    }}
                    onClick={() => handleSort('trangThai')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Trạng thái</span>
                      {getSortIcon('trangThai')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody 
                className="divide-y"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                {filteredAndSortedChannels.map((channel) => (
                  <tr 
                    key={channel.id} 
                    className="cursor-pointer transition-colors"
                    style={{
                      color: 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => handleViewChannel(channel)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)'
                          }}
                        >
                          {getPlatformIcon(channel.platform)}
                        </div>
                        <div className="ml-3">
                          <div 
                            className="text-sm font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {channel.tenKenh}
                          </div>
                          <div 
                            className="text-xs font-mono"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            {channel.idKenh}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getPlatformIcon(channel.platform)}
                        <span 
                          className="ml-2 text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {channel.platform}
                        </span>
                      </div>
                    </td>
                    <td 
                      className="px-6 py-4 text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {channel.nguoiPhuTrach}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div 
                          className="flex items-center text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Users 
                            className="w-4 h-4 mr-2"
                            style={{ color: 'var(--text-tertiary)' }}
                          />
                          <span>{channel.subscribers?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div 
                          className="flex items-center text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Play 
                            className="w-4 h-4 mr-2"
                            style={{ color: 'var(--text-tertiary)' }}
                          />
                          <span>{channel.views?.toLocaleString() || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td 
                      className="px-6 py-4 text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {channel.ngayTao}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        channel.trangThai === 'Hoạt động' ? 'bg-green-100 text-green-800' :
                        channel.trangThai === 'Tạm ngưng' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {channel.trangThai}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewChannel(channel);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditChannel(channel, e);
                          }}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChannel(channel, e);
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

      {/* Channel Detail Modal */}
      {selectedChannel && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Chi tiết kênh"
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  {getPlatformIcon(selectedChannel.platform)}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-slate-900">{selectedChannel.tenKenh}</h3>
                  <p className="text-sm text-slate-500">{selectedChannel.platform}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">ID Kênh</p>
                  <p className="text-base font-medium font-mono">{selectedChannel.idKenh}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Người phụ trách</p>
                  <p className="text-base font-medium">{selectedChannel.nguoiPhuTrach}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Ngày tạo</p>
                  <p className="text-base">{selectedChannel.ngayTao}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Trạng thái</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    selectedChannel.trangThai === 'Hoạt động' ? 'bg-green-100 text-green-800' :
                    selectedChannel.trangThai === 'Tạm ngưng' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedChannel.trangThai}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Thống kê</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Người đăng ký</p>
                  <p className="text-xl font-semibold text-slate-900">{selectedChannel.subscribers?.toLocaleString() || 'N/A'}</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Lượt xem</p>
                  <p className="text-xl font-semibold text-slate-900">{selectedChannel.views?.toLocaleString() || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Liên kết</h3>
                
                <div className="space-y-2">
                  {selectedChannel.platform === 'YouTube' && (
                    <a 
                      href={`https://youtube.com/channel/${selectedChannel.idKenh}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Youtube className="w-4 h-4 mr-2" />
                      <span>Xem kênh trên YouTube</span>
                    </a>
                  )}
                  
                  {selectedChannel.platform === 'Facebook' && (
                    <a 
                      href={`https://facebook.com/${selectedChannel.idKenh}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Facebook className="w-4 h-4 mr-2" />
                      <span>Xem trang trên Facebook</span>
                    </a>
                  )}
                </div>
              </div>
              
              {selectedChannel.ghiChu && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Ghi chú</h3>
                  <p className="text-base">{selectedChannel.ghiChu}</p>
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
            Bạn có chắc chắn muốn xóa kênh <span className="font-semibold">{selectedChannel?.tenKenh}</span>?
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

      {/* Add/Edit Channel Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={isEditMode ? "Chỉnh sửa kênh" : "Thêm kênh mới"}
        size="md"
      >
        <div className="py-4">
          <form className="space-y-4" onSubmit={handleFormSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tên kênh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tenKenh"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={selectedChannel?.tenKenh || ''}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ID Kênh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="idKenh"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={selectedChannel?.idKenh || ''}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nền tảng <span className="text-red-500">*</span>
                </label>
                <select
                  name="platform"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedChannel?.platform || ''}
                  required
                >
                  <option value="">-- Chọn nền tảng --</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Facebook">Facebook</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Người phụ trách <span className="text-red-500">*</span>
                </label>
                <select
                  name="nguoiPhuTrach"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedChannel?.nguoiPhuTrach || ''}
                  required
                >
                  <option value="">-- Chọn người phụ trách --</option>
                  <option value="Tuấn">Tuấn</option>
                  <option value="Bình">Bình</option>
                  <option value="Nghĩa">Nghĩa</option>
                  <option value="Trân">Trân</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Người đăng ký
                </label>
                <input
                  type="number"
                  name="subscribers"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedChannel?.subscribers || ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lượt xem
                </label>
                <input
                  type="number"
                  name="views"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedChannel?.views || ''}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ngày tạo <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="ngayTao"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedChannel?.ngayTao ? selectedChannel.ngayTao.split('/').reverse().join('-') : ''}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  name="trangThai"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedChannel?.trangThai || 'Hoạt động'}
                  required
                >
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Tạm ngưng">Tạm ngưng</option>
                  <option value="Đã xóa">Đã xóa</option>
                </select>
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
                defaultValue={selectedChannel?.ghiChu || ''}
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

export default Channels;