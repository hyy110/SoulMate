import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCharacter, deleteCharacter, publishCharacter, likeCharacter, unlikeCharacter, type Character } from '../api/characters';
import { useAuthStore } from '../stores/authStore';
import { showSuccess, showError } from '../components/UI/Toast';

const GENDER_LABELS: Record<string, string> = { male: '男', female: '女', other: '其他' };
const RELATIONSHIP_LABELS: Record<string, string> = {
  girlfriend: '女友',
  boyfriend: '男友',
  friend: '朋友',
  custom: '自定义',
};
const STATUS_LABELS: Record<string, string> = { draft: '草稿', published: '已发布', banned: '已封禁' };

export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getCharacter(id)
      .then((c) => {
        setCharacter(c);
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          showError('角色不存在');
          navigate('/');
        } else {
          showError('加载失败');
        }
      })
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  const isOwner = character && user && character.creator_id === user.id;

  const handlePublish = async () => {
    if (!character) return;
    try {
      const updated = await publishCharacter(character.id);
      setCharacter(updated);
      showSuccess(updated.status === 'published' ? '角色已发布' : '角色已取消发布');
    } catch {
      showError('操作失败');
    }
  };

  const handleDelete = async () => {
    if (!character) return;
    try {
      await deleteCharacter(character.id);
      showSuccess('角色已删除');
      navigate('/');
    } catch {
      showError('删除失败');
    }
  };

  const handleLike = async () => {
    if (!character) return;
    try {
      if (isLiked) {
        await unlikeCharacter(character.id);
        setIsLiked(false);
        setCharacter((prev) => prev ? { ...prev, like_count: Math.max(prev.like_count - 1, 0) } : prev);
      } else {
        await likeCharacter(character.id);
        setIsLiked(true);
        setCharacter((prev) => prev ? { ...prev, like_count: prev.like_count + 1 } : prev);
      }
    } catch {
      showError('操作失败');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (!character) return null;

  return (
    <div className="space-y-6 pb-8">
      {/* Cover/Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-8 text-white">
        <div className="relative z-10 flex items-center gap-6">
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-4xl font-bold backdrop-blur">
            {character.avatar_url ? (
              <img src={character.avatar_url} alt={character.name} className="h-full w-full rounded-full object-cover" />
            ) : (
              character.name.charAt(0)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold">{character.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-0.5 text-sm">
                {RELATIONSHIP_LABELS[character.relationship_type] || character.relationship_type}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-0.5 text-sm">
                {GENDER_LABELS[character.gender] || character.gender}
              </span>
              <span className={`rounded-full px-3 py-0.5 text-sm ${
                character.status === 'published' ? 'bg-green-500/30' : 'bg-yellow-500/30'
              }`}>
                {STATUS_LABELS[character.status] || character.status}
              </span>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-pink-500/20" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{character.like_count}</p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">点赞</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{character.chat_count}</p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">对话</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{character.share_count}</p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">分享</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={handleLike} className={`btn-secondary flex items-center gap-2 ${isLiked ? 'text-red-500 border-red-300' : ''}`}>
          {isLiked ? '❤️' : '🤍'} {isLiked ? '已点赞' : '点赞'}
        </button>
        {isOwner && (
          <>
            <Link to={`/character/${character.id}/edit`} className="btn-secondary">
              ✏️ 编辑
            </Link>
            <button onClick={handlePublish} className="btn-secondary">
              {character.status === 'published' ? '📤 取消发布' : '📢 发布'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-secondary text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              🗑️ 删除
            </button>
          </>
        )}
      </div>

      {/* Description */}
      {character.description && (
        <section className="card">
          <h2 className="mb-2 text-lg font-semibold">简介</h2>
          <p className="leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
            {character.description}
          </p>
        </section>
      )}

      {/* Personality */}
      {character.personality && (
        <section className="card">
          <h2 className="mb-2 text-lg font-semibold">性格</h2>
          <p className="whitespace-pre-wrap leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
            {character.personality}
          </p>
        </section>
      )}

      {/* Backstory */}
      {character.backstory && (
        <section className="card">
          <h2 className="mb-2 text-lg font-semibold">背景故事</h2>
          <p className="whitespace-pre-wrap leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
            {character.backstory}
          </p>
        </section>
      )}

      {/* Tags */}
      {character.tags && character.tags.length > 0 && (
        <section className="card">
          <h2 className="mb-2 text-lg font-semibold">标签</h2>
          <div className="flex flex-wrap gap-2">
            {character.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Greeting */}
      {character.greeting_message && (
        <section className="card">
          <h2 className="mb-2 text-lg font-semibold">开场白</h2>
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
            <p className="italic text-text-light-secondary dark:text-text-dark-secondary">
              "{character.greeting_message}"
            </p>
          </div>
        </section>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-surface-light p-6 shadow-xl dark:bg-surface-dark" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">确定删除角色？</h3>
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              删除后将无法恢复，角色的所有对话记录也将被清除。
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-600"
              >
                确定删除
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
