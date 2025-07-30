import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, User, Lock, Mail, UserPlus } from 'lucide-react';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isLogin) {
      // Login logic
      if (!formData.email.endsWith('@vcpmc.org')) {
        toast.error('Email phải có định dạng @vcpmc.org');
        setIsLoading(false);
        return;
      }

      const success = await login(formData.email, formData.password);
      if (success) {
        toast.success('Đăng nhập thành công!');
        navigate('/');
      } else {
        toast.error('Email hoặc mật khẩu không đúng');
      }
    } else {
      // Register logic
      if (!formData.email.endsWith('@vcpmc.org')) {
        toast.error('Email phải có định dạng @vcpmc.org');
        setIsLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Mật khẩu xác nhận không khớp');
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        toast.error('Mật khẩu phải có ít nhất 6 ký tự');
        setIsLoading(false);
        return;
      }

      // Mock registration
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      setIsLogin(true);
      setFormData({ email: '', password: '', fullName: '', confirmPassword: '' });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-secondary-400/20 to-secondary-600/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-large border border-white/20 p-8 animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">Contract Manager</h1>
            <p className="text-secondary-600">
              {isLogin ? 'Đăng nhập vào hệ thống' : 'Tạo tài khoản mới'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="input-modern pl-12"
                    placeholder="Nhập họ và tên"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-modern pl-12"
                  placeholder="example@vcpmc.org"
                  required
                />
              </div>
              <p className="text-xs text-secondary-500 mt-2">Email phải có định dạng @vcpmc.org</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-modern pl-12 pr-12"
                  placeholder="Nhập mật khẩu"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 p-1 rounded-lg hover:bg-secondary-100 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isLogin && (
                <p className="text-xs text-secondary-500 mt-2 bg-primary-50 p-2 rounded-lg">
                  <strong>Demo:</strong> admin@vcpmc.org / 123456
                </p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="input-modern pl-12"
                    placeholder="Nhập lại mật khẩu"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isLoading}
              className="py-3.5 text-base font-semibold"
            >
              {isLoading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ email: '', password: '', fullName: '', confirmPassword: '' });
              }}
              className="text-primary-600 hover:text-primary-800 font-semibold transition-colors duration-200 p-2 rounded-lg hover:bg-primary-50"
            >
              {isLogin ? (
                <>
                  <UserPlus className="w-4 h-4 inline mr-1" />
                  Chưa có tài khoản? Đăng ký ngay
                </>
              ) : (
                <>
                  <User className="w-4 h-4 inline mr-1" />
                  Đã có tài khoản? Đăng nhập
                </>
              )}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-secondary-200">
            <div className="text-center text-sm text-secondary-500">
              <p>Hệ thống quản lý hợp đồng âm nhạc</p>
              <p className="mt-1">© 2025 VCPMC. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;