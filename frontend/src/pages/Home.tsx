import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getCharacters, type Character } from '../api/characters';
import { getConversations, type Conversation } from '../api/conversations';
import { getPublishedCharacters } from '../api/characters';
import { formatRelativeTime } from '../utils';

const RELATIONSHIP_LABELS: Record<string, string> = {
  girlfriend: '女友',
  boyfriend: '男友',
  friend: '朋友',
  custom: '自定义',
};

function CharacterCard({ character }: { character: Character }) {
  return (
    <Link
      to={`/character/${character.id}`}
      className="card group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-pink-500 text-2xl font-bold text-white">
          {character.avatar_url ? (
            <img src={character.avatar_url} alt={character.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            character.name.charAt(0)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{character.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {character.description || '暂无简介'}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              {RELATIONSHIP_LABELS[character.relationship_type] || character.relationship_type}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              character.status === 'published'
                ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {character.status === 'published' ? '已发布' : '草稿'}
            </span>
          </div>
        </div>
        <div className="text-text-light-secondary dark:text-text-dark-secondary">→</div>
      </div>
    </Link>
  );
}

function ConversationCard({ conversation }: { conversation: Conversation }) {
  return (
    <Link
      to={`/chat/${conversation.id}`}
      className="card group cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-pink-500 text-lg font-bold text-white">
          {conversation.character_name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="truncate text-sm font-semibold group-hover:text-primary-600 dark:group-hover:text-primary-400">
              {conversation.character_name}
            </h3>
            <span className="flex-shrink-0 text-xs text-text-light-secondary dark:text-text-dark-secondary">
              {formatRelativeTime(conversation.updated_at)}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {conversation.title || '暂无消息'}
          </p>
        </div>
      </div>
    </Link>
  );
}

function RecommendedCarousel({ characters }: { characters: Character[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollToIndex = useCallback((idx: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = 280 + 16;
    container.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
    setCurrentIndex(idx);
  }, []);

  useEffect(() => {
    if (characters.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % characters.length;
        scrollToIndex(next);
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [characters.length, scrollToIndex]);

  if (characters.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">推荐角色</h2>
        <Link
          to="/explore"
          className="text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          查看全部 →
        </Link>
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {characters.map((char) => (
            <Link
              key={char.id}
              to={`/character/${char.id}`}
              className="w-[280px] flex-shrink-0 scroll-snap-start"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="card group relative h-[180px] overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-pink-500/10 dark:from-primary-500/20 dark:to-pink-500/20" />
                <div className="relative z-10 flex h-full flex-col justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-pink-500 text-lg font-bold text-white">
                      {char.avatar_url ? (
                        <img src={char.avatar_url} alt={char.name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        char.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold group-hover:text-primary-600 dark:group-hover:text-primary-400">
                        {char.name}
                      </h3>
                      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        {char.chat_count} 次对话
                      </span>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    {char.description || char.greeting_message || '等你来聊~'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {characters.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {characters.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex
                    ? 'w-6 bg-primary-600'
                    : 'w-1.5 bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ConversationSkeleton() {
  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-14 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-3 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuthStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [recommended, setRecommended] = useState<Character[]>([]);
  const [isLoadingChars, setIsLoadingChars] = useState(true);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);

  useEffect(() => {
    getCharacters(1, 6)
      .then((res) => setCharacters(res.items))
      .catch(() => {})
      .finally(() => setIsLoadingChars(false));

    getConversations()
      .then((convs) => setConversations(convs.slice(0, 5)))
      .catch(() => {})
      .finally(() => setIsLoadingConvs(false));

    getPublishedCharacters(1, 8)
      .then((res) => setRecommended(res.items))
      .catch(() => {});
  }, []);

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

      {/* Recommended Carousel */}
      {recommended.length > 0 && <RecommendedCarousel characters={recommended} />}

      {/* Recent Conversations */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">最近对话</h2>
          {conversations.length > 0 && (
            <Link
              to="/explore"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              发现更多角色 →
            </Link>
          )}
        </div>

        {isLoadingConvs ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <ConversationCard key={conv.id} conversation={conv} />
            ))}
          </div>
        ) : (
          <div className="card text-center">
            <p className="py-8 text-text-light-secondary dark:text-text-dark-secondary">
              还没有对话记录，创建角色后即可开始聊天
            </p>
          </div>
        )}
      </section>

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

        {isLoadingChars ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="card">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : characters.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {characters.map((char) => (
              <CharacterCard key={char.id} character={char} />
            ))}
          </div>
        ) : (
          <div className="card text-center">
            <div className="py-8">
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
          </div>
        )}
      </section>
    </div>
  );
}
