import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { showError, showSuccess } from '../components/UI/Toast';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validate = (): string | null => {
    if (!username.trim()) return '请输入用户名';
    if (username.trim().length < 3) return '用户名至少 3 个字符';
    if (!email.trim()) return '请输入邮箱';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '邮箱格式不正确';
    if (!password) return '请输入密码';
    if (password.length < 6) return '密码至少 6 个字符';
    if (password !== confirmPassword) return '两次输入的密码不一致';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      showError(error);
      return;
    }
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        nickname: nickname.trim() || undefined,
      });
      showSuccess('注册成功！');
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || '注册失败，请稍后再试';
      showError(msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light px-4 dark:bg-background-dark">
      <div className="w-full max-w-md">
        <div className="card space-y-8">
          {/* Brand */}
          <div className="text-center">
            <h1 className="gradient-text text-4xl font-bold tracking-tight">SoulMate</h1>
            <p className="mt-2 text-text-light-secondary dark:text-text-dark-secondary">
              创建你的账户，发现 AI 伙伴
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="username" className="block text-sm font-medium">
                用户名 <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                type="text"
                className="input-field"
                placeholder="3 个字符以上"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium">
                邮箱 <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="nickname" className="block text-sm font-medium">
                昵称
              </label>
              <input
                id="nickname"
                type="text"
                className="input-field"
                placeholder="可选，留空默认使用用户名"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium">
                密码 <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="至少 6 个字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                确认密码 <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="input-field"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  注册中...
                </span>
              ) : (
                '注册'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
            已有账户？{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 transition-colors hover:text-primary-500"
            >
              登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
