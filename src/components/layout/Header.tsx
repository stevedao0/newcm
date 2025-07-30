import React, { useState } from 'react';
import { Menu, Search, Bell, User, Calendar, Filter, Download, Plus, X, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { format } from 'date-fns';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
  showActions?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, title, showActions = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-soft border-b border-secondary-200/50 relative">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2.5 rounded-xl text-secondary-600 hover:bg-secondary-100 lg:hidden transition-all duration-200 hover:scale-105"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {title ? (
            <div className="ml-4 flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-secondary-900">{title}</h1>
            </div>
          ) : (
            <div className="relative ml-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm hợp đồng, tác phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pl-12 pr-4 py-3 w-96 shadow-soft"
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {showActions && (
            <div className="flex space-x-2 mr-4">
              <button className="btn-secondary">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Lọc theo ngày</span>
              </button>
              
              <button className="btn-secondary">
                <Filter className="w-4 h-4 mr-2" />
                <span>Lọc nâng cao</span>
              </button>
              
              <button className="btn-success">
                <Download className="w-4 h-4 mr-2" />
                <span>Xuất Excel</span>
              </button>
              
              <button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                <span>Thêm mới</span>
              </button>
            </div>
          )}
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 text-secondary-600 hover:bg-secondary-100 rounded-xl relative transition-all duration-200 hover:scale-105"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-danger-500 to-danger-600 text-white text-xs rounded-full flex items-center justify-center shadow-soft animate-pulse-soft">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 modal-modern z-50 animate-slide-down">
                <div className="p-4 border-b border-secondary-200 flex justify-between items-center bg-gradient-to-r from-secondary-50/50 to-white">
                  <h3 className="font-semibold text-secondary-900">Thông báo</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-secondary-400 hover:text-secondary-600 p-1 rounded-lg hover:bg-secondary-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto scrollbar-modern">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-secondary-500">
                      <Bell className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                      Không có thông báo nào
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className={`p-4 border-b border-secondary-100 cursor-pointer transition-all duration-200 ${
                          !notification.read ? 'bg-primary-50 hover:bg-primary-100' : 'hover:bg-secondary-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className={`text-sm font-semibold ${
                              !notification.read ? 'text-secondary-900' : 'text-secondary-700'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-secondary-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-secondary-400 mt-2">
                              {format(notification.timestamp, 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full ml-2 mt-1 animate-pulse-soft"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-soft hover:shadow-glow transition-all duration-200 cursor-pointer">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-secondary-900">{user?.fullName}</p>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-success-400 rounded-full mr-2"></div>
                <p className="text-xs text-secondary-500">
                  {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;