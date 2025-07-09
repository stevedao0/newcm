import React from 'react';
import { ContractLog } from '../../types/contract';
import { Clock, User, FileText } from 'lucide-react';

interface ContractLogTableProps {
  logs: ContractLog[];
  className?: string;
}

const ContractLogTable: React.FC<ContractLogTableProps> = ({ logs, className = '' }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Chưa có nhật ký</h3>
          <p className="text-slate-600">Chưa có hoạt động nào được ghi lại cho hợp đồng này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Thời gian
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Người thực hiện
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Hành động
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Chi tiết
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-slate-400 mr-2" />
                    <span className="text-sm text-slate-600">{log.date}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-slate-400 mr-2" />
                    <span className="text-sm font-medium text-slate-900">{log.user}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    log.action === 'Tạo mới' ? 'bg-green-100 text-green-800' :
                    log.action === 'Cập nhật' ? 'bg-blue-100 text-blue-800' :
                    log.action === 'Xóa' ? 'bg-red-100 text-red-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600">{log.details}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractLogTable;