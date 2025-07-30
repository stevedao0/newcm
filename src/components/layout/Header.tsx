import React, { useState } from 'react';
import { Menu, Search, Bell, User, Calendar, Filter, Download, Plus, X, Sparkles, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  return (
    <header 
      className="backdrop-blur-xl border-b relative transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)',
        boxShadow: '0 2px 15px -3px var(--shadow-color)'
      }}
    >
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
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))`
                }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
            </div>
          ) : (
            <div className="relative ml-4">
              <Search 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                style={{ color: 'var(--text-tertiary)' }}
              />
              <input
                type="text"
                placeholder="Tìm kiếm hợp đồng, tác phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pl-12 pr-4 py-3 w-96"
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
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-xl transition-all duration-200 hover:scale-105"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 rounded-xl relative transition-all duration-200 hover:scale-105"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
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
                <div 
                  className="p-4 border-b flex justify-between items-center"
                  style={{
                    borderColor: 'var(--border-primary)',
                    background: 'var(--bg-tertiary)'
                  }}
                >
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Thông báo</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={markAllAsRead}
                      className="text-sm font-medium transition-colors"
                      style={{ 
                        color: 'var(--accent-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--accent-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--accent-primary)';
                      }}
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-lg transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-tertiary)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto scrollbar-modern">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                      <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                      Không có thông báo nào
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className="p-4 border-b cursor-pointer transition-all duration-200"
                        style={{
                          borderColor: 'var(--border-primary)',
                          backgroundColor: !notification.read ? 'rgba(251, 146, 60, 0.1)' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = !notification.read 
                            ? 'rgba(251, 146, 60, 0.15)' 
                            : 'var(--bg-tertiary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = !notification.read 
                            ? 'rgba(251, 146, 60, 0.1)' 
                            : 'transparent';
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 
                              className="text-sm font-semibold"
                              style={{
                                color: !notification.read ? 'var(--text-primary)' : 'var(--text-secondary)'
                              }}
                            >
                              {notification.title}
                            </h4>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {notification.message}
                            </p>
                            <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                              {format(notification.timestamp, 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                          {!notification.read && (
                            <div 
                              className="w-2 h-2 rounded-full ml-2 mt-1 animate-pulse-soft"
                              style={{ backgroundColor: 'var(--accent-primary)' }}
                            ></div>
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
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105"
              style={{
                background: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))`,
                boxShadow: '0 2px 15px -3px var(--shadow-color)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(251, 146, 60, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 15px -3px var(--shadow-color)';
              }}
            >
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.fullName}</p>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-success-400 rounded-full mr-2"></div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
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