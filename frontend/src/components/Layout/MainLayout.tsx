import { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { getCharacters, type Character } from '../../api/characters';
import { debounce } from '../../utils';

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/explore', label: '探索' },
  { to: '/character/create', label: '创建角色' },
];

const mobileTabs = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/explore', label: '发现', icon: '🔍' },
  { to: '/character/create', label: '创建', icon: '➕' },
  { to: '/profile', label: '我的', icon: '👤' },
];

const sidebarLinks = [
  { to: '/', label: '首页' },
  { to: '/explore', label: '发现角色' },
  { to: '/character/create', label: '创建角色' },
  { to: '/profile', label: '个人中心' },
  { to: '/profile/voices', label: '音色管理' },
  { to: '/settings', label: '设置' },
];

function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Character[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(
    debounce((q: string) => {
      if (!q.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      getCharacters(1, 6, q)
        .then((res) => setResults(res.items))
        .catch(() => setResults([]))
        .finally(() => setIsSearching(false));
    }, 300),
    [],
  );

  useEffect(() => {
    doSearch(query);
  }, [query, doSearch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative hidden w-64 md:block">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder="搜索角色..."
          className="w-full rounded-lg border border-border-light bg-gray-50 py-2 pl-9 pr-3 text-sm transition-colors placeholder:text-text-light-secondary focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500/20 dark:border-border-dark dark:bg-gray-800 dark:placeholder:text-text-dark-secondary dark:focus:bg-gray-700"
        />
      </div>
      {showResults && (query.trim() || results.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border-light bg-white shadow-lg dark:border-border-dark dark:bg-surface-dark">
          {isSearching ? (
            <div className="px-4 py-3 text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
              搜索中...
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-72 overflow-y-auto py-1">
              {results.map((char) => (
                <button
                  key={char.id}
                  onClick={() => {
                    navigate(`/character/${char.id}`);
                    setShowResults(false);
                    setQuery('');
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-pink-500 text-xs font-bold text-white">
                    {char.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{char.name}</p>
                    <p className="truncate text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {char.description || '暂无简介'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="px-4 py-3 text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
              未找到相关角色
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function UserDropdown() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const menuItems = [
    { label: '个人中心', to: '/profile' },
    { label: '音色管理', to: '/profile/voices' },
    { label: '设置', to: '/settings' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-white">
          {(user.nickname || user.username).charAt(0).toUpperCase()}
        </div>
        <span className="hidden font-medium sm:inline">
          {user.nickname || user.username}
        </span>
        <svg className={clsx('h-4 w-4 transition-transform', open && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-border-light bg-white py-1 shadow-lg animate-slide-down dark:border-border-dark dark:bg-surface-dark">
          <div className="border-b border-border-light px-4 py-2.5 dark:border-border-dark">
            <p className="truncate text-sm font-medium">{user.nickname || user.username}</p>
            <p className="truncate text-xs text-text-light-secondary dark:text-text-dark-secondary">{user.email}</p>
          </div>
          {menuItems.map((item) => (
            <button
              key={item.to}
              onClick={() => {
                navigate(item.to);
                setOpen(false);
              }}
              className="flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {item.label}
            </button>
          ))}
          <div className="border-t border-border-light dark:border-border-dark">
            <button
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="flex w-full items-center px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MainLayout() {
  const location = useLocation();
  const { user } = useAuthStore();

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
            <GlobalSearch />
            <UserDropdown />
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
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          <div className="mx-auto max-w-5xl">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-light bg-surface-light/95 px-2 py-2 backdrop-blur md:hidden dark:border-border-dark dark:bg-surface-dark/95">
        <div className="grid grid-cols-4 gap-1">
          {mobileTabs.map((tab) => {
            const active = location.pathname === tab.to;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={clsx(
                  'flex flex-col items-center justify-center rounded-xl py-1.5 text-xs transition-colors',
                  active
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-text-light-secondary dark:text-text-dark-secondary',
                )}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
