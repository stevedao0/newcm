import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  Globe, 
  Database, 
  Shield, 
  FileText, 
  Save,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Users,
  Plus
} from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { User as UserType } from '../types/contract';
import Modal from '../components/ui/Modal';
import { useNotifications } from '../contexts/NotificationContext';
import { db } from '../services/database';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [users, setUsers] = useState<UserType[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const { addNotification } = useNotifications();

  useEffect(() => {
    loadUsers();
    
    // Subscribe to database changes
    const unsubscribe = db.subscribe('users', loadUsers);
    return unsubscribe;
  }, []);

  const loadUsers = () => {
    try {
      const dbUsers = db.getAll('users');
      if (dbUsers.length === 0) {
        // Initialize with sample data
        const sampleUsers: UserType[] = [
          {
            id: '1',
            username: 'admin',
            fullName: 'Admin User',
            email: 'admin@vcpmc.org',
            role: 'admin',
            status: 'active',
            lastLogin: new Date().toISOString()
          },
          {
            id: '2',
            username: 'user',
            fullName: 'User Client',
            email: 'user@vcpmc.org',
            role: 'user',
            status: 'active',
            lastLogin: new Date().toISOString()
          }
        ];
        
        sampleUsers.forEach(user => {
          db.create('users', user);
        });
        setUsers(sampleUsers);
      } else {
        setUsers(dbUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsEditMode(false);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: UserType) => {
    setSelectedUser(user);
    setIsEditMode(true);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (user: UserType) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleManageRoles = () => {
    setIsRoleModalOpen(true);
  };

  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const userData = {
      username: formData.get('username') as string,
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as UserType['role'],
      status: formData.get('status') as UserType['status'],
      lastLogin: new Date().toISOString()
    };

    // Validate email format
    if (!userData.email.endsWith('@vcpmc.org')) {
      toast.error('Email phải có định dạng @vcpmc.org');
      return;
    }

    // Check if username or email already exists (for new users)
    if (!isEditMode) {
      const existingUsers = db.getAll('users');
      const usernameExists = existingUsers.some(u => u.username === userData.username);
      const emailExists = existingUsers.some(u => u.email === userData.email);
      
      if (usernameExists) {
        toast.error('Tên đăng nhập đã tồn tại');
        return;
      }
      
      if (emailExists) {
        toast.error('Email đã tồn tại');
        return;
      }
    }

    try {
      if (isEditMode && selectedUser) {
        await db.update('users', selectedUser.id, userData);
        toast.success('Cập nhật người dùng thành công!');
        addNotification({
          title: 'Người dùng được cập nhật',
          message: `Người dùng ${userData.fullName} đã được cập nhật`,
          type: 'success'
        });
      } else {
        await db.create('users', userData);
        toast.success('Thêm người dùng thành công!');
        addNotification({
          title: 'Người dùng mới',
          message: `Người dùng ${userData.fullName} đã được thêm`,
          type: 'success'
        });
      }
      setIsUserModalOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Có lỗi xảy ra khi lưu người dùng');
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedUser && selectedUser.username !== 'admin') {
      try {
        await db.delete('users', selectedUser.id);
        toast.success('Xóa người dùng thành công!');
        addNotification({
          title: 'Người dùng đã xóa',
          message: `Người dùng ${selectedUser.fullName} đã được xóa`,
          type: 'info'
        });
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Có lỗi xảy ra khi xóa người dùng');
      }
    }
  };

  const userColumns = [
    { 
      header: 'Tên người dùng', 
      accessor: (user: UserType) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
            {user.fullName.charAt(0)}
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-slate-900">{user.fullName}</div>
            <div className="text-xs text-slate-500">{user.username}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Email', 
      accessor: 'email',
      className: 'text-sm text-slate-600'
    },
    { 
      header: 'Vai trò', 
      accessor: (user: UserType) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
          user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
          'bg-slate-100 text-slate-800'
        }`}>
          {user.role === 'admin' ? 'Quản trị viên' :
           user.role === 'manager' ? 'Quản lý' : 'Người dùng'}
        </span>
      ),
      className: 'w-32'
    },
    { 
      header: 'Trạng thái', 
      accessor: (user: UserType) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
        </span>
      ),
      className: 'w-32'
    },
    { 
      header: 'Đăng nhập cuối', 
      accessor: (user: UserType) => user.lastLogin ? new Date(user.lastLogin).toLocaleString('vi-VN') : 'Chưa đăng nhập',
      className: 'text-sm text-slate-600 w-40'
    },
    { 
      header: 'Thao tác', 
      accessor: (user: UserType) => (
        <div className="flex space-x-2">
          <button 
            onClick={() => handleEditUser(user)}
            className="p-1 text-green-600 hover:bg-green-100 rounded"
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDeleteUser(user)}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
            title="Xóa"
            disabled={user.username === 'admin'}
          >
            <Trash2 className={`w-4 h-4 ${user.username === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`} />
          </button>
        </div>
      ),
      className: 'w-20'
    }
  ];

  const roles = [
    { id: 'admin', name: 'Quản trị viên', description: 'Toàn quyền quản lý hệ thống', permissions: ['Quản lý người dùng', 'Quản lý hợp đồng', 'Quản lý tác phẩm', 'Quản lý đối tác', 'Quản lý kênh', 'Xem báo cáo', 'Xuất báo cáo', 'Cài đặt hệ thống'] },
    { id: 'manager', name: 'Quản lý', description: 'Quản lý hợp đồng và báo cáo', permissions: ['Quản lý hợp đồng', 'Quản lý tác phẩm', 'Quản lý đối tác', 'Quản lý kênh', 'Xem báo cáo', 'Xuất báo cáo'] },
    { id: 'user', name: 'Người dùng', description: 'Chỉ xem và thực hiện các thao tác cơ bản', permissions: ['Xem hợp đồng', 'Xem tác phẩm', 'Xem đối tác', 'Xem kênh'] },
    { id: 'client', name: 'Khách hàng', description: 'Chỉ xem hợp đồng và tác phẩm của mình', permissions: ['Xem hợp đồng (giới hạn)', 'Xem tác phẩm (giới hạn)'] }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Cài đặt</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Quản lý cài đặt hệ thống và tài khoản người dùng</p>
      </div>

      {/* Settings Tabs */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
            activeTab === 'profile'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Hồ sơ
        </button>
        
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
            activeTab === 'security'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4 inline mr-2" />
          Bảo mật
        </button>
        
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Thông báo
        </button>
        
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
            activeTab === 'system'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-2" />
          Hệ thống
        </button>
        
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
            activeTab === 'users'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Người dùng
        </button>
        
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
            activeTab === 'roles'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Phân quyền
        </button>
      </div>

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900">Thông tin cá nhân</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                    A
                  </div>
                  <div className="ml-6">
                    <Button variant="outline" size="sm">Thay đổi ảnh</Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue="Admin User"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tên đăng nhập
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue="admin"
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue="admin@vcpmc.org"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue=""
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button variant="primary" icon={Save}>
                    Lưu thay đổi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900">Đổi mật khẩu</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button variant="primary" icon={Save}>
                    Cập nhật mật khẩu
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900">Bảo mật tài khoản</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Xác thực hai yếu tố</h4>
                    <p className="text-sm text-slate-500 mt-1">Bảo vệ tài khoản của bạn bằng xác thực hai yếu tố</p>
                  </div>
                  <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Thông báo đăng nhập</h4>
                    <p className="text-sm text-slate-500 mt-1">Nhận thông báo khi có đăng nhập mới vào tài khoản</p>
                  </div>
                  <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Phiên đăng nhập</h4>
                    <p className="text-sm text-slate-500 mt-1">Quản lý các phiên đăng nhập của bạn</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Quản lý phiên
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">Cài đặt thông báo</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Thông báo hợp đồng sắp hết hạn</h4>
                  <p className="text-sm text-slate-500 mt-1">Nhận thông báo khi hợp đồng sắp hết hạn</p>
                </div>
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Thông báo hợp đồng mới</h4>
                  <p className="text-sm text-slate-500 mt-1">Nhận thông báo khi có hợp đồng mới được tạo</p>
                </div>
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Thông báo cập nhật hợp đồng</h4>
                  <p className="text-sm text-slate-500 mt-1">Nhận thông báo khi hợp đồng được cập nhật</p>
                </div>
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Thông báo email</h4>
                  <p className="text-sm text-slate-500 mt-1">Nhận thông báo qua email</p>
                </div>
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Thông báo trên trình duyệt</h4>
                  <p className="text-sm text-slate-500 mt-1">Hiển thị thông báo trên trình duyệt</p>
                </div>
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button variant="primary" icon={Save}>
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Settings */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900">Cài đặt hệ thống</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Ngôn ngữ</h4>
                    <p className="text-sm text-slate-500 mt-1">Chọn ngôn ngữ hiển thị</p>
                  </div>
                  <select className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Múi giờ</h4>
                    <p className="text-sm text-slate-500 mt-1">Chọn múi giờ hiển thị</p>
                  </div>
                  <select className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                    <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                    <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Định dạng ngày</h4>
                    <p className="text-sm text-slate-500 mt-1">Chọn định dạng hiển thị ngày tháng</p>
                  </div>
                  <select className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Chế độ tối</h4>
                    <p className="text-sm text-slate-500 mt-1">Bật/tắt chế độ tối</p>
                  </div>
                  <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Sao lưu dữ liệu</h4>
                    <p className="text-sm text-slate-500 mt-1">Tạo bản sao lưu dữ liệu hệ thống</p>
                  </div>
                  <Button variant="outline" size="sm" icon={Database}>
                    Tạo bản sao lưu
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button variant="primary" icon={Save}>
                  Lưu thay đổi
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900">Cài đặt nâng cao</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Xóa dữ liệu tạm</h4>
                    <p className="text-sm text-slate-500 mt-1">Xóa tất cả dữ liệu tạm thời</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Xóa dữ liệu tạm
                  </Button>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Nhật ký hệ thống</h4>
                    <p className="text-sm text-slate-500 mt-1">Xem nhật ký hoạt động hệ thống</p>
                  </div>
                  <Button variant="outline" size="sm" icon={FileText}>
                    Xem nhật ký
                  </Button>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Khôi phục cài đặt gốc</h4>
                    <p className="text-sm text-slate-500 mt-1">Đặt lại tất cả cài đặt về mặc định</p>
                  </div>
                  <Button variant="danger" size="sm">
                    Khôi phục
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Management */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">Quản lý người dùng</h3>
            <Button 
              variant="primary" 
              icon={UserPlus}
              onClick={handleAddUser}
            >
              Thêm người dùng
            </Button>
          </div>
          
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {userColumns.map((column, index) => (
                      <th 
                        key={index} 
                        className={`px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${column.className || ''}`}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {users.map((user, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-50">
                      {userColumns.map((column, colIndex) => (
                        <td key={colIndex} className={`px-6 py-4 ${column.className || ''}`}>
                          {typeof column.accessor === 'function' ? column.accessor(user) : user[column.accessor as keyof UserType]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Role Management */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">Quản lý phân quyền</h3>
            <Button 
              variant="primary" 
              icon={Shield}
              onClick={handleManageRoles}
            >
              Quản lý vai trò
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map(role => (
              <Card key={role.id} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">{role.name}</h4>
                      <p className="text-sm text-slate-600 mt-1">{role.description}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      icon={Edit}
                      onClick={() => handleManageRoles()}
                    >
                      Sửa
                    </Button>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-slate-700 mb-2">Quyền hạn:</h5>
                    <ul className="space-y-1">
                      {role.permissions.map((permission, index) => (
                        <li key={index} className="text-sm text-slate-600 flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          {permission}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={isEditMode ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
        size="md"
      >
        <div className="py-4">
          <form className="space-y-4" onSubmit={handleUserFormSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedUser?.fullName || ''}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedUser?.username || ''}
                  required
                  disabled={isEditMode}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={selectedUser?.email || ''}
                placeholder="example@vcpmc.org"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Email phải có định dạng @vcpmc.org</p>
            </div>
            
            {!isEditMode && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    required
                  />
                  <button 
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedUser?.role || 'user'}
                  required
                >
                  <option value="admin">Quản trị viên</option>
                  <option value="manager">Quản lý</option>
                  <option value="user">Người dùng</option>
                  <option value="client">Khách hàng</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedUser?.status || 'active'}
                  required
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsUserModalOpen(false)}
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

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xác nhận xóa"
        size="sm"
      >
        <div className="py-4">
          <p className="text-slate-700">
            Bạn có chắc chắn muốn xóa người dùng <span className="font-semibold">{selectedUser?.fullName}</span>?
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

      {/* Role Management Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Quản lý vai trò"
        size="lg"
      >
        <div className="py-4">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-slate-900">Danh sách vai trò</h4>
              <Button 
                variant="outline" 
                size="sm"
                icon={Plus}
              >
                Thêm vai trò mới
              </Button>
            </div>
            
            <div className="space-y-4">
              {roles.map(role => (
                <div key={role.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-md font-semibold text-slate-900">{role.name}</h5>
                      <p className="text-sm text-slate-600 mt-1">{role.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        icon={Edit}
                      >
                        Sửa
                      </Button>
                      {role.id !== 'admin' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          icon={Trash2}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h6 className="text-sm font-medium text-slate-700 mb-2">Quyền hạn:</h6>
                    <div className="grid grid-cols-2 gap-2">
                      {role.permissions.map((permission, index) => (
                        <div key={index} className="flex items-center">
                          <input 
                            type="checkbox" 
                            id={`${role.id}-${index}`} 
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            defaultChecked
                          />
                          <label htmlFor={`${role.id}-${index}`} className="ml-2 text-sm text-slate-600">
                            {permission}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsRoleModalOpen(false)}
            >
              Hủy
            </Button>
            <Button 
              variant="primary" 
              icon={Save}
            >
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;