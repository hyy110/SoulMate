import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="gradient-text text-3xl font-bold">SoulMate</h1>
          <p className="mt-2 text-text-light-secondary dark:text-text-dark-secondary">
            登录你的账户
          </p>
        </div>
        <form className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium">
              用户名
            </label>
            <input
              id="username"
              type="text"
              className="input-field"
              placeholder="请输入用户名"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              密码
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="请输入密码"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            登录
          </button>
        </form>
        <p className="text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
          还没有账户？{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
