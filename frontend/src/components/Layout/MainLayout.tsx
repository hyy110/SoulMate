import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/authStore';

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/explore', label: '探索' },
  { to: '/character/create', label: '创建角色' },
];

const sidebarLinks = [
  { to: '/', label: '首页' },
  { to: '/explore', label: '发现角色' },
  { to: '/character/create', label: '创建角色' },
  { to: '/profile', label: '个人中心' },
  { to: '/settings', label: '设置' },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen flex-col bg-background-light dark:bg-background-dark">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-border-light bg-surface-light/80 backdrop-blur-lg dark:border-border-dark dark:bg-surface-dark/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="gradient-text text-xl font-bold">SoulMate</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={clsx(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  location.pathname === link.to
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-text-light-secondary hover:bg-gray-100 dark:text-text-dark-secondary dark:hover:bg-gray-800',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User area */}
          <div className="flex items-center gap-3">
            {user && (
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-white">
                  {(user.nickname || user.username).charAt(0).toUpperCase()}
                </div>
                <span className="hidden font-medium sm:inline">
                  {user.nickname || user.username}
                </span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm text-text-light-secondary transition-colors hover:bg-red-50 hover:text-red-600 dark:text-text-dark-secondary dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-60 flex-shrink-0 border-r border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark lg:block">
          <div className="flex h-full flex-col p-4">
            <nav className="flex-1 space-y-1">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={clsx(
                    'block rounded-lg px-3 py-2 text-sm transition-colors',
                    location.pathname === link.to
                      ? 'bg-primary-50 font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-text-light-secondary hover:bg-gray-100 dark:text-text-dark-secondary dark:hover:bg-gray-800',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Sidebar user info */}
            {user && (
              <div className="border-t border-border-light pt-4 dark:border-border-dark">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-white">
                    {(user.nickname || user.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {user.nickname || user.username}
                    </p>
                    <p className="truncate text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
