import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Music, 
  Building2, 
  BarChart3, 
  Settings,
  Users,
  UserCircle,
  LogOut,
  Upload
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin', 'user'] },
    { icon: FileText, label: 'Hợp đồng', path: '/contracts', roles: ['admin', 'user'] },
    { icon: Music, label: 'Tác phẩm', path: '/works', roles: ['admin', 'user'] },
    { icon: Building2, label: 'Đối tác', path: '/partners', roles: ['admin'] },
    { icon: Users, label: 'Kênh', path: '/channels', roles: ['admin'] },
    { icon: Upload, label: 'Nhập dữ liệu', path: '/import-data', roles: ['admin'] },
    { icon: BarChart3, label: 'Báo cáo', path: '/reports', roles: ['admin', 'user'] },
    { icon: Settings, label: 'Cài đặt', path: '/settings', roles: ['admin'] }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'user')
  );

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0 lg:static lg:inset-0
    `}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 px-4 bg-slate-800">
          <h1 className="text-xl font-bold text-white">Contract Manager</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.fullName}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="mt-4 flex items-center w-full px-4 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;