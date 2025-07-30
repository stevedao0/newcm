import React, { useState } from 'react';
import { Calendar, Filter, Download, BarChart, PieChart, LineChart } from 'lucide-react';
import Button from './Button';
import Card, { CardHeader, CardContent } from './Card';
import { ReportFilter } from '../../types/contract';
import { format } from 'date-fns';

interface ReportGeneratorProps {
  onGenerateReport: (filter: ReportFilter) => void;
  onExportReport: (format: 'csv' | 'excel' | 'pdf') => void;
  className?: string;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ 
  onGenerateReport, 
  onExportReport,
  className = '' 
}) => {
  const [filter, setFilter] = useState<ReportFilter>({
    period: 'month',
    type: 'contracts',
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateReport(filter);
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Tạo báo cáo</h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Loại báo cáo
              </label>
              <select
                name="type"
                value={filter.type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="contracts">Hợp đồng</option>
                <option value="revenue">Doanh thu</option>
                <option value="works">Tác phẩm</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Thời gian
              </label>
              <select
                name="period"
                value={filter.period}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="day">Theo ngày</option>
                <option value="week">Theo tuần</option>
                <option value="month">Theo tháng</option>
                <option value="year">Theo năm</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Lĩnh vực
              </label>
              <select
                name="linhVuc"
                value={filter.linhVuc || ''}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tất cả lĩnh vực</option>
                <option value="Sao chép trực tuyến">Sao chép trực tuyến</option>
                <option value="Biểu diễn">Biểu diễn</option>
                <option value="Phát sóng">Phát sóng</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tình trạng
              </label>
              <select
                name="tinhTrang"
                value={filter.tinhTrang || ''}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Đã ký">Đã ký</option>
                <option value="Tái ký">Tái ký</option>
                <option value="Khảo sát">Khảo sát</option>
                <option value="Đàm phán">Đàm phán</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Người phụ trách
              </label>
              <select
                name="nguoiPhuTrach"
                value={filter.nguoiPhuTrach || ''}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tất cả người phụ trách</option>
                <option value="Tuấn">Tuấn</option>
                <option value="Bình">Bình</option>
                <option value="Nghĩa">Nghĩa</option>
                <option value="Trân">Trân</option>
              </select>
            </div>
            
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Khoảng thời gian
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="date"
                    name="startDate"
                    value={filter.startDate || ''}
                    onChange={handleDateChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="relative">
                  <input
                    type="date"
                    name="endDate"
                    value={filter.endDate || ''}
                    onChange={handleDateChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-between">
            <div className="flex flex-wrap gap-3">
              <Button 
                type="submit"
                variant="primary" 
                icon={filter.type === 'contracts' ? BarChart : 
                       filter.type === 'revenue' ? LineChart : PieChart}
              >
                Tạo báo cáo
              </Button>
              
              <Button 
                type="button"
                variant="outline" 
                icon={Calendar}
                onClick={() => {
                  const today = new Date();
                  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                  
                  setFilter(prev => ({
                    ...prev,
                    startDate: format(startOfMonth, 'yyyy-MM-dd'),
                    endDate: format(today, 'yyyy-MM-dd')
                  }));
                }}
              >
                Tháng hiện tại
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                type="button"
                variant="success" 
                icon={Download}
                onClick={() => onExportReport('csv')}
              >
                Xuất CSV
              </Button>
              
              <Button 
                type="button"
                variant="success" 
                icon={Download}
                onClick={() => onExportReport('excel')}
              >
                Xuất Excel
              </Button>
              
              <Button 
                type="button"
                variant="success" 
                icon={Download}
                onClick={() => onExportReport('pdf')}
              >
                Xuất PDF
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;