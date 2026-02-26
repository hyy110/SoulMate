import { Outlet, Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

const navLinks = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/explore', label: '探索', icon: '🔍' },
  { to: '/character/create', label: '创建', icon: '✨' },
  { to: '/profile', label: '我的', icon: '👤' },
];

const sidebarLinks = [
  { to: '/explore', label: '发现角色' },
  { to: '/character/create', label: '创建角色' },
  { to: '/settings', label: '设置' },
];

export default function MainLayout() {
  const location = useLocation();

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
          <div className="flex items-center gap-3">
            <Link to="/settings" className="btn-secondary px-3 py-1.5 text-sm">
              设置
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-60 flex-shrink-0 border-r border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark lg:block">
          <nav className="space-y-1">
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
