import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { type Character } from '../api/characters';
import { createConversation } from '../api/conversations';
import { showError } from '../components/UI/Toast';

interface UserPublicProfile {
  id: string;
  username: string;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export default function UserPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState<UserPublicProfile | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function load() {
      try {
        const [profileRes, charsRes] = await Promise.all([
          apiClient.get<UserPublicProfile>(`/users/${userId}`),
          apiClient.get<{ items: Character[] }>(`/users/${userId}/characters`),
        ]);

        if (cancelled) return;
        setUserProfile(profileRes.data);
        setCharacters(charsRes.data.items || []);
      } catch {
        if (!cancelled) {
          showError('加载用户信息失败');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const handleChat = useCallback(
    async (characterId: string) => {
      setChatLoading(characterId);
      try {
        const conv = await createConversation({ character_id: characterId });
        navigate(`/chat/${conv.id}`);
      } catch {
        showError('创建对话失败');
      } finally {
        setChatLoading(null);
      }
    },
    [navigate],
  );

  const displayName = userProfile?.nickname || userProfile?.username || '用户';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="flex flex-col items-center">
                <div className="mb-3 h-16 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="card py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl dark:bg-gray-800">
          😢
        </div>
        <h2 className="text-lg font-semibold">用户不存在</h2>
        <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          该用户不存在或已被删除
        </p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4 px-6 py-2">
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info Header */}
      <div className="card flex flex-col items-center gap-4 py-8 sm:flex-row sm:items-center sm:py-6">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-pink-500 text-3xl font-bold text-white ring-4 ring-primary-100 dark:ring-primary-900/30">
          {userProfile.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt={displayName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            @{userProfile.username}
          </p>
          {userProfile.bio && (
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {userProfile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Characters */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">
          {displayName} 的角色
          <span className="ml-2 text-base font-normal text-text-light-secondary dark:text-text-dark-secondary">
            ({characters.length})
          </span>
        </h2>

        {characters.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((char) => (
              <div
                key={char.id}
                className="card group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
                onClick={() => navigate(`/character/${char.id}`)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-pink-500 text-2xl font-bold text-white">
                    {char.avatar_url ? (
                      <img src={char.avatar_url} alt={char.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      char.name.charAt(0)
                    )}
                  </div>
                  <h3 className="font-semibold group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {char.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    {char.description || '暂无简介'}
                  </p>
                  {char.tags && char.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap justify-center gap-1">
                      {char.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    <span>{char.like_count} 喜欢</span>
                    <span>{char.chat_count} 聊天</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChat(char.id);
                    }}
                    disabled={chatLoading === char.id}
                    className="btn-primary mt-3 w-full gap-2 py-2 text-sm"
                  >
                    {chatLoading === char.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      '开始聊天'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl dark:bg-gray-800">
              🎭
            </div>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              该用户还没有公开的角色
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
