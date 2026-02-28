import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Home() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section className="text-center">
        <h1 className="gradient-text text-4xl font-bold">
          {user ? `你好，${user.nickname || user.username}` : '欢迎来到 SoulMate'}
        </h1>
        <p className="mt-3 text-lg text-text-light-secondary dark:text-text-dark-secondary">
          发现你的 AI 灵魂伴侣，开启独特的对话体验
        </p>
      </section>

      {/* Quick Actions */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/character/create" className="card group cursor-pointer">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-2xl transition-transform group-hover:scale-110 dark:bg-primary-900/30">
            ✨
          </div>
          <h3 className="font-semibold">创建角色</h3>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            打造你的专属 AI 伙伴
          </p>
        </Link>

        <Link to="/explore" className="card group cursor-pointer">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50 text-2xl transition-transform group-hover:scale-110 dark:bg-pink-900/30">
            🔍
          </div>
          <h3 className="font-semibold">探索角色</h3>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            发现社区中分享的角色
          </p>
        </Link>

        <Link to="/profile" className="card group cursor-pointer">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl transition-transform group-hover:scale-110 dark:bg-blue-900/30">
            👤
          </div>
          <h3 className="font-semibold">个人中心</h3>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            管理你的资料和角色
          </p>
        </Link>
      </section>

      {/* My Characters Placeholder */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">我的角色</h2>
          <Link
            to="/character/create"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            创建新角色 →
          </Link>
        </div>
        <div className="card text-center">
          <p className="py-8 text-text-light-secondary dark:text-text-dark-secondary">
            还没有创建角色，
            <Link to="/character/create" className="font-medium text-primary-600 hover:text-primary-500">
              立即创建
            </Link>
            你的第一个 AI 伙伴吧！
          </p>
        </div>
      </section>

      {/* Recent Conversations Placeholder */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">最近对话</h2>
        <div className="card text-center">
          <p className="py-8 text-text-light-secondary dark:text-text-dark-secondary">
            还没有对话记录，创建角色后即可开始聊天
          </p>
        </div>
      </section>
    </div>
  );
}
