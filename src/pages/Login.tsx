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
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))`
      }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(234, 88, 12, 0.2))`
          }}
        ></div>
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(100, 116, 139, 0.2))`
          }}
        ></div>
      </div>
      
      <div className="max-w-md w-full">
        <div 
          className="backdrop-blur-xl rounded-3xl border p-8 animate-scale-in"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-primary)',
            boxShadow: '0 10px 40px -10px var(--shadow-color), 0 20px 25px -5px var(--shadow-color)'
          }}
        >
          <div className="text-center mb-8">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))`,
                boxShadow: '0 0 20px rgba(251, 146, 60, 0.3)'
              }}
            >
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Contract Manager</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? 'Đăng nhập vào hệ thống' : 'Tạo tài khoản mới'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                    style={{ color: 'var(--text-tertiary)' }}
                  />
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
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                  style={{ color: 'var(--text-tertiary)' }}
                />
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
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>Email phải có định dạng @vcpmc.org</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                  style={{ color: 'var(--text-tertiary)' }}
                />
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
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-colors"
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
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isLogin && (
                <p 
                  className="text-xs mt-2 p-2 rounded-lg"
                  style={{ 
                    color: 'var(--text-tertiary)',
                    backgroundColor: 'rgba(251, 146, 60, 0.1)'
                  }}
                >
                  <strong>Demo:</strong> admin@vcpmc.org / 123456
                </p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                    style={{ color: 'var(--text-tertiary)' }}
                  />
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
              className="font-semibold transition-colors duration-200 p-2 rounded-lg"
              style={{ color: 'var(--accent-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent-secondary)';
                e.currentTarget.style.backgroundColor = 'rgba(251, 146, 60, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--accent-primary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
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
            <div className="text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
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