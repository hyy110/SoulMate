import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { getCharacters, type Character } from '../api/characters';
import { createConversation } from '../api/conversations';
import { showError } from '../components/UI/Toast';
import { debounce } from '../utils';

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'girlfriend', label: '女友' },
  { key: 'boyfriend', label: '男友' },
  { key: 'friend', label: '朋友' },
  { key: 'popular', label: '热门' },
  { key: 'latest', label: '最新' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function ExploreCard({
  character,
  onChat,
  chatLoading,
}: {
  character: Character;
  onChat: (id: string) => void;
  chatLoading: string | null;
}) {
  const navigate = useNavigate();

  return (
    <div
      className="card group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
      onClick={() => navigate(`/character/${character.id}`)}
    >
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-pink-500 text-3xl font-bold text-white ring-4 ring-primary-100 transition-transform group-hover:scale-105 dark:ring-primary-900/30">
          {character.avatar_url ? (
            <img
              src={character.avatar_url}
              alt={character.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            character.name.charAt(0)
          )}
        </div>

        {/* Name */}
        <h3 className="text-base font-semibold">{character.name}</h3>

        {/* Description */}
        <p className="mt-1 line-clamp-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {character.description || '暂无简介'}
        </p>

        {/* Tags */}
        {character.tags && character.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {character.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-xs text-text-light-secondary dark:text-text-dark-secondary">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            {character.like_count}
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            {character.chat_count}
          </span>
        </div>

        {/* Chat Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChat(character.id);
          }}
          disabled={chatLoading === character.id}
          className="btn-primary mt-4 w-full gap-2 py-2 text-sm"
        >
          {chatLoading === character.id ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              开始聊天
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Explore() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [chatLoading, setChatLoading] = useState<string | null>(null);

  const debouncedSetSearch = useMemo(
    () => debounce((val: string) => setDebouncedSearch(val), 400),
    [],
  );

  useEffect(() => {
    debouncedSetSearch(searchQuery);
  }, [searchQuery, debouncedSetSearch]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getCharacters(page, 12, debouncedSearch || undefined)
      .then((res) => {
        if (cancelled) return;
        setCharacters(res.items);
        setTotalPages(res.pages);
      })
      .catch(() => {
        if (!cancelled) showError('加载角色失败');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, debouncedSearch]);

  const filteredCharacters = useMemo(() => {
    if (activeTab === 'all') return characters;
    if (activeTab === 'popular') return [...characters].sort((a, b) => b.like_count - a.like_count);
    if (activeTab === 'latest') return [...characters].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return characters.filter((c) => c.relationship_type === activeTab);
  }, [characters, activeTab]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="gradient-text text-2xl font-bold">探索角色</h1>
        <p className="mt-1 text-text-light-secondary dark:text-text-dark-secondary">
          发现有趣的 AI 角色，开始你的对话之旅
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索角色名称、描述..."
          className="input-field pl-11"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-gradient-to-r from-primary-600 to-pink-500 text-white shadow-md shadow-primary-600/25'
                : 'bg-gray-100 text-text-light-secondary hover:bg-gray-200 dark:bg-gray-800 dark:text-text-dark-secondary dark:hover:bg-gray-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card flex flex-col items-center">
              <div className="mb-3 h-20 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-4 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-4 h-9 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl dark:bg-gray-800">
            🔍
          </div>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            {debouncedSearch ? `没有找到"${debouncedSearch}"相关的角色` : '暂无角色'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCharacters.map((char) => (
              <ExploreCard
                key={char.id}
                character={char}
                onChat={handleChat}
                chatLoading={chatLoading}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
              >
                上一页
              </button>
              <span className="px-3 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
