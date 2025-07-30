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
  Upload,
  Sparkles
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
      fixed inset-y-0 left-0 z-50 w-72 sidebar-modern transform transition-all duration-500 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0 lg:static lg:inset-0
    `}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-20 px-6 bg-gradient-to-r from-primary-600 to-primary-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="relative flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Contract Manager</h1>
              <p className="text-xs text-primary-100">Hệ thống quản lý hợp đồng</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-modern">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  window.location.pathname === item.path 
                    ? 'bg-white/20 shadow-glow' 
                    : 'group-hover:bg-secondary-600/50'
                }`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{item.label}</span>
              </div>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-secondary-700/50 bg-gradient-to-r from-secondary-800/50 to-transparent">
          <div className="flex items-center p-3 rounded-xl bg-secondary-800/50 backdrop-blur-sm">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-soft">
              <UserCircle className="w-7 h-7 text-white" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-white">{user?.fullName}</p>
              <p className="text-xs text-secondary-300">{user?.email}</p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-success-400 rounded-full mr-2"></div>
                <span className="text-xs text-secondary-400">
                  {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="mt-4 flex items-center w-full px-4 py-3 text-sm font-medium text-secondary-300 rounded-xl hover:bg-secondary-700/50 hover:text-white transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-danger-600/20 transition-all duration-200">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="ml-3">Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;