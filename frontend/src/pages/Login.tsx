import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { showError } from '../components/UI/Toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showError('请填写用户名和密码');
      return;
    }
    try {
      await login({ username: username.trim(), password });
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || '登录失败，请检查用户名和密码';
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
              登录你的账户，开始对话
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label htmlFor="username" className="block text-sm font-medium">
                用户名
              </label>
              <input
                id="username"
                type="text"
                className="input-field"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium">
                密码
              </label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
            还没有账户？{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 transition-colors hover:text-primary-500"
            >
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
