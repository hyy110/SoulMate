import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="gradient-text text-3xl font-bold">SoulMate</h1>
          <p className="mt-2 text-text-light-secondary dark:text-text-dark-secondary">
            创建你的账户
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
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="请输入邮箱"
            />
          </div>
          <div>
            <label htmlFor="nickname" className="mb-1 block text-sm font-medium">
              昵称
            </label>
            <input
              id="nickname"
              type="text"
              className="input-field"
              placeholder="请输入昵称"
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
            注册
          </button>
        </form>
        <p className="text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
          已有账户？{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
