import React, { useState } from 'react';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon, 
  Calendar, 
  Download, 
  FileText,
  DollarSign,
  Music,
  Users,
  Building2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { contractsData } from '../data/contracts';
import { channelsData } from '../data/channels';
import { partnersData } from '../data/partners';
import ReportGenerator from '../components/ui/ReportGenerator';
import { ReportFilter, ReportData } from '../types/contract';
import { exportReport } from '../utils/exportUtils';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'revenue' | 'works'>('overview');
  const [reportFilter, setReportFilter] = useState<ReportFilter>({
    period: 'month',
    type: 'contracts'
  });
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  
  // Calculate statistics
  const totalContracts = contractsData.length;
  const activeContracts = contractsData.filter(contract => {
    const endDate = new Date(contract.ngayKetThuc.split('/').reverse().join('-'));
    return endDate > new Date();
  }).length;
  
  const totalRevenue = contractsData.reduce((sum, contract) => {
    return sum + parseInt(contract.mucNhuanBut.replace(/,/g, ''));
  }, 0);
  
  const totalPartners = partnersData.length;
  
  // Chart data
  const monthlyData = [
    { month: 'T1', contracts: 45, revenue: 125000000 },
    { month: 'T2', contracts: 52, revenue: 140000000 },
    { month: 'T3', contracts: 38, revenue: 98000000 },
    { month: 'T4', contracts: 67, revenue: 180000000 },
    { month: 'T5', contracts: 58, revenue: 156000000 },
    { month: 'T6', contracts: 73, revenue: 195000000 },
    { month: 'T7', contracts: 61, revenue: 165000000 },
    { month: 'T8', contracts: 70, revenue: 188000000 },
    { month: 'T9', contracts: 55, revenue: 148000000 },
    { month: 'T10', contracts: 63, revenue: 170000000 },
    { month: 'T11', contracts: 48, revenue: 130000000 },
    { month: 'T12', contracts: 80, revenue: 215000000 },
  ];

  const statusData = [
    { name: 'Đã ký', value: contractsData.filter(c => c.tinhTrang === 'Đã ký').length, color: '#10B981' },
    { name: 'Tái ký', value: contractsData.filter(c => c.tinhTrang === 'Tái ký').length, color: '#3B82F6' },
    { name: 'Khảo sát', value: contractsData.filter(c => c.tinhTrang === 'Khảo sát').length, color: '#8B5CF6' },
    { name: 'Đàm phán', value: contractsData.filter(c => c.tinhTrang === 'Đàm phán').length, color: '#F59E0B' },
  ];

  // Format types data
  const formatData = [
    { name: 'Video', value: contractsData.filter(c => c.hinhThuc.includes('Video')).length, color: '#6366F1' },
    { name: 'Audio', value: contractsData.filter(c => c.hinhThuc.includes('Audio')).length, color: '#14B8A6' },
    { name: 'MV Karaoke', value: contractsData.filter(c => c.hinhThuc.includes('Karaoke')).length, color: '#EC4899' }
  ];
  
  // Top partners data
  const topPartners = [...partnersData]
    .sort((a, b) => b.tongDoanhThu - a.tongDoanhThu)
    .slice(0, 5);
  
  // Top channels data
  const topChannels = [...channelsData]
    .sort((a, b) => (b.subscribers || 0) - (a.subscribers || 0))
    .slice(0, 5);

  // Generate report data based on filter
  const generateReportData = (filter: ReportFilter) => {
    console.log('Generating report with filter:', filter);
    
    // In a real app, this would filter data based on the filter parameters
    // For demo purposes, we'll just use the monthly data
    let data: ReportData[];
    
    if (filter.period === 'month') {
      data = monthlyData.map(item => ({
        label: item.month,
        contracts: item.contracts,
        revenue: item.revenue,
        works: Math.floor(item.contracts * 0.8) // Just for demo
      }));
    } else if (filter.period === 'quarter') {
      data = [
        { label: 'Q1', contracts: 135, revenue: 363000000, works: 108 },
        { label: 'Q2', contracts: 198, revenue: 531000000, works: 158 },
        { label: 'Q3', contracts: 186, revenue: 501000000, works: 149 },
        { label: 'Q4', contracts: 191, revenue: 515000000, works: 153 }
      ];
    } else if (filter.period === 'year') {
      data = [
        { label: '2020', contracts: 423, revenue: 1150000000, works: 338 },
        { label: '2021', contracts: 512, revenue: 1380000000, works: 410 },
        { label: '2022', contracts: 587, revenue: 1580000000, works: 470 },
        { label: '2023', contracts: 645, revenue: 1740000000, works: 516 },
        { label: '2024', contracts: 705, revenue: 1900000000, works: 564 },
        { label: '2025', contracts: 320, revenue: 864000000, works: 256 }
      ];
    } else { // day
      data = [
        { label: '01/05', contracts: 5, revenue: 13500000, works: 4 },
        { label: '02/05', contracts: 3, revenue: 8100000, works: 2 },
        { label: '03/05', contracts: 7, revenue: 18900000, works: 6 },
        { label: '04/05', contracts: 4, revenue: 10800000, works: 3 },
        { label: '05/05', contracts: 6, revenue: 16200000, works: 5 },
        { label: '06/05', contracts: 8, revenue: 21600000, works: 6 },
        { label: '07/05', contracts: 5, revenue: 13500000, works: 4 }
      ];
    }
    
    setReportData(data);
    setReportFilter(filter);
    setActiveTab(filter.type === 'revenue' ? 'revenue' : 
                filter.type === 'works' ? 'works' : 'contracts');
  };

  // Export report data
  const exportReportData = (format: 'csv' | 'excel' | 'pdf') => {
    const title = `Báo cáo ${
      reportFilter.type === 'contracts' ? 'Hợp đồng' : 
      reportFilter.type === 'revenue' ? 'Doanh thu' : 'Tác phẩm'
    } theo ${
      reportFilter.period === 'day' ? 'ngày' :
      reportFilter.period === 'week' ? 'tuần' :
      reportFilter.period === 'month' ? 'tháng' : 'năm'
    }`;
    
    exportReport(reportData, title, format);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Báo cáo</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Thống kê và phân tích dữ liệu hợp đồng</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant={showReportGenerator ? "primary" : "outline"}
            onClick={() => setShowReportGenerator(!showReportGenerator)}
          >
            {showReportGenerator ? "Ẩn bộ lọc" : "Tạo báo cáo"}
          </Button>
        </div>
      </div>

      {/* Report Generator */}
      {showReportGenerator && (
        <ReportGenerator 
          onGenerateReport={generateReportData}
          onExportReport={exportReportData}
        />
      )}

      {/* Report Tabs */}
      {reportData.length > 0 && (
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'contracts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Hợp đồng
          </button>
          
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'revenue'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            Doanh thu
          </button>
          
          <button
            onClick={() => setActiveTab('works')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'works'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Music className="w-4 h-4 inline mr-2" />
            Tác phẩm
          </button>
        </div>
      )}

      {/* Generated Report */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">
              {activeTab === 'contracts' ? 'Báo cáo số lượng hợp đồng' : 
               activeTab === 'revenue' ? 'Báo cáo doanh thu' : 
               'Báo cáo tác phẩm'}
              {reportFilter.period === 'day' ? ' theo ngày' :
               reportFilter.period === 'week' ? ' theo tuần' :
               reportFilter.period === 'month' ? ' theo tháng' : 
               ' theo năm'}
            </h3>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                icon={Download}
                onClick={() => exportReportData('excel')}
              >
                Xuất Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                icon={Download}
                onClick={() => exportReportData('pdf')}
              >
                Xuất PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              {activeTab === 'contracts' ? (
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="label"
                    stroke="#64748b" 
                  />
                  <YAxis 
                    stroke="#64748b"
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value} hợp đồng`, 'Số lượng']}
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="contracts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : activeTab === 'revenue' ? (
                <LineChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="label"
                    stroke="#64748b" 
                  />
                  <YAxis 
                    stroke="#64748b"
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${(value / 1000000).toFixed(2)}M VNĐ`, 'Doanh thu']}
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              ) : (
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="label"
                    stroke="#64748b" 
                  />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    formatter={(value: any) => [`${value} tác phẩm`, 'Số lượng']}
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="works" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Overview Section (shown when no report is generated) */}
      {reportData.length === 0 && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-600">
                  +12%
                </span>
              </div>
              
              <h3 className="text-slate-600 text-sm font-medium mb-1">Tổng hợp đồng</h3>
              <p className="text-3xl font-bold text-slate-900">{totalContracts}</p>
            </Card>
            
            <Card className="bg-white p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-600">
                  +8%
                </span>
              </div>
              
              <h3 className="text-slate-600 text-sm font-medium mb-1">Hợp đồng hiệu lực</h3>
              <p className="text-3xl font-bold text-slate-900">{activeContracts}</p>
            </Card>
            
            <Card className="bg-white p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-600">
                  +15%
                </span>
              </div>
              
              <h3 className="text-slate-600 text-sm font-medium mb-1">Tổng doanh thu</h3>
              <p className="text-3xl font-bold text-slate-900">{`${(totalRevenue / 1000000).toFixed(1)}M VNĐ`}</p>
            </Card>
            
            <Card className="bg-white p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-600">
                  +3%
                </span>
              </div>
              
              <h3 className="text-slate-600 text-sm font-medium mb-1">Đối tác</h3>
              <p className="text-3xl font-bold text-slate-900">{totalPartners}</p>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Contracts Chart */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Hợp đồng theo tháng</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="contracts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Phân bố tình trạng hợp đồng</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Format Distribution */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Phân bố hình thức tác phẩm</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {formatData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Revenue Chart */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">Doanh thu theo tháng</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis 
                      stroke="#64748b"
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${(value / 1000000).toFixed(2)}M VNĐ`, 'Doanh thu']}
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Partners */}
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900">Đối tác hàng đầu</h3>
                <Building2 className="w-5 h-5 text-slate-400" />
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tên đơn vị
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Hợp đồng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Doanh thu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {topPartners.map((partner) => (
                      <tr key={partner.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{partner.tenDonVi}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {partner.soHopDongDaKy}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {partner.tongDoanhThu.toLocaleString()} VNĐ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Top Channels */}
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900">Kênh hàng đầu</h3>
                <Users className="w-5 h-5 text-slate-400" />
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tên kênh
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Người đăng ký
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Lượt xem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {topChannels.map((channel) => (
                      <tr key={channel.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-slate-900">{channel.tenKenh}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {channel.subscribers?.toLocaleString() || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {channel.views?.toLocaleString() || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;