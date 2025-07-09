import React from 'react';
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Users,
  Calendar,
  Music,
  PlayCircle,
  Clock,
  Building2
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { contractsData } from '../data/contracts';
import { channelsData } from '../data/channels';
import { partnersData } from '../data/partners';

const Dashboard: React.FC = () => {
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
  ];

  const statusData = [
    { name: 'Đã ký', value: contractsData.filter(c => c.tinhTrang === 'Đã ký').length, color: '#10B981' },
    { name: 'Tái ký', value: contractsData.filter(c => c.tinhTrang === 'Tái ký').length, color: '#3B82F6' },
    { name: 'Ký mới', value: contractsData.filter(c => c.tinhTrang === 'Ký mới').length, color: '#F59E0B' },
  ];

  // Recent contracts
  const recentContracts = [...contractsData]
    .sort((a, b) => {
      const dateA = new Date(a.ngayKy.split('/').reverse().join('-'));
      const dateB = new Date(b.ngayKy.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Tổng quan hệ thống quản lý hợp đồng âm nhạc</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng hợp đồng"
          value={totalContracts.toString()}
          change="+12%"
          changeType="positive"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Hợp đồng hiệu lực"
          value={activeContracts.toString()}
          change="+8%"
          changeType="positive"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Tổng doanh thu"
          value={`${(totalRevenue / 1000000).toFixed(1)}M VNĐ`}
          change="+15%"
          changeType="positive"
          icon={DollarSign}
          color="orange"
        />
        <StatCard
          title="Đối tác"
          value={totalPartners.toString()}
          change="+3%"
          changeType="positive"
          icon={Building2}
          color="purple"
        />
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
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Contracts */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900">Hợp đồng gần đây</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tác phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Kênh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Ngày ký
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Nhuận bút
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {recentContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Music className="w-4 h-4 text-slate-400 mr-3" />
                      <span className="text-sm font-medium text-slate-900">{contract.tenTacPham}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{contract.tenKenh}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{contract.ngayKy}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {parseInt(contract.mucNhuanBut.replace(/,/g, '')).toLocaleString()} VNĐ
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      contract.tinhTrang === 'Đã ký' ? 'bg-green-100 text-green-800' :
                      contract.tinhTrang === 'Tái ký' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {contract.tinhTrang}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Tạo hợp đồng mới</h3>
              <p className="text-blue-100 text-sm">Khởi tạo hợp đồng với đối tác</p>
            </div>
            <FileText className="w-8 h-8 text-blue-200" />
          </div>
          <button className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
            Tạo mới
          </button>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Quản lý tác phẩm</h3>
              <p className="text-green-100 text-sm">Thêm và chỉnh sửa tác phẩm</p>
            </div>
            <Music className="w-8 h-8 text-green-200" />
          </div>
          <button className="mt-4 bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors">
            Quản lý
          </button>
        </div>

        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Xem báo cáo</h3>
              <p className="text-orange-100 text-sm">Thống kê và phân tích dữ liệu</p>
            </div>
            <BarChart className="w-8 h-8 text-orange-200" />
          </div>
          <button className="mt-4 bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors">
            Xem báo cáo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;