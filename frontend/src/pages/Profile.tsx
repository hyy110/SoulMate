import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { updateProfile } from '../api/auth';
import { getCharacters, type Character } from '../api/characters';
import { getConversations } from '../api/conversations';
import { showSuccess, showError } from '../components/UI/Toast';

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-2xl dark:bg-primary-900/30">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">{label}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, setUser } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterCount, setCharacterCount] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getCharacters(1, 50).catch(() => ({ items: [] as Character[], total: 0 })),
      getConversations().catch(() => []),
    ]).then(([charRes, convs]) => {
      if (cancelled) return;
      const charData = 'items' in charRes ? charRes : { items: [], total: 0 };
      setCharacters(charData.items);
      setCharacterCount(charData.total);
      setConversationCount(Array.isArray(convs) ? convs.length : 0);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({ nickname: nickname || undefined, bio: bio || undefined });
      setUser(updated);
      setIsEditing(false);
      showSuccess('资料更新成功');
    } catch {
      showError('更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.nickname || user?.username || '用户';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="card flex flex-col items-center py-8 sm:flex-row sm:items-start sm:gap-8 sm:py-6">
        {/* Avatar */}
        <div className="mb-4 flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-pink-500 text-4xl font-bold text-white ring-4 ring-primary-100 dark:ring-primary-900/30 sm:mb-0">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={displayName} className="h-full w-full rounded-full object-cover" />
          ) : (
            initial
          )}
        </div>

        {/* Info / Edit form */}
        <div className="flex-1 text-center sm:text-left">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="输入昵称"
                  className="input-field"
                  maxLength={30}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">简介</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="介绍一下自己..."
                  className="input-field resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>
              <div className="flex gap-2 sm:justify-start">
                <button onClick={handleSave} disabled={saving} className="btn-primary px-5 py-2 text-sm">
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNickname(user?.nickname || '');
                    setBio(user?.bio || '');
                  }}
                  className="btn-secondary px-5 py-2 text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <p className="mt-0.5 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {user?.email}
              </p>
              {user?.bio && (
                <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {user.bio}
                </p>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary mt-3 gap-1.5 px-4 py-1.5 text-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                编辑资料
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="创建的角色" value={characterCount} icon="🎭" />
        <StatCard label="对话数" value={conversationCount} icon="💬" />
      </div>

      {/* My Characters */}
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

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : characters.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((char) => (
              <Link
                key={char.id}
                to={`/character/${char.id}`}
                className="card group transition-all hover:scale-[1.02] hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-pink-500 text-xl font-bold text-white">
                    {char.avatar_url ? (
                      <img src={char.avatar_url} alt={char.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      char.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {char.name}
                    </h3>
                    <p className="line-clamp-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {char.description || '暂无简介'}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      <span>{char.like_count} 喜欢</span>
                      <span>·</span>
                      <span>{char.chat_count} 聊天</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-3xl dark:bg-primary-900/30">
              ✨
            </div>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              还没有创建角色，
              <Link to="/character/create" className="font-medium text-primary-600 hover:text-primary-500">
                立即创建
              </Link>
              你的第一个 AI 伙伴吧！
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
