import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createVoiceProfile,
  deleteVoiceProfile,
  getVoiceTrainingStatus,
  getVoices,
  previewVoice,
  startVoiceTraining,
  type VoiceProfile,
} from '../api/voice';
import { showError, showSuccess } from '../components/UI/Toast';

const LANGUAGE_OPTIONS = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'multi', label: '多语言' },
];

function formatEta(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '即将完成';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs.toString().padStart(2, '0')}秒`;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'ready':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'training':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'pending':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    case 'failed':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

export default function VoiceProfiles() {
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [language, setLanguage] = useState('zh');
  const [cloneMode, setCloneMode] = useState<'zeroshot' | 'training'>('zeroshot');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [previewText, setPreviewText] = useState('你好，很高兴认识你。');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);

  const loadVoices = async (keepLoading = false) => {
    if (!keepLoading) setLoading(true);
    try {
      const data = await getVoices();
      setVoices(data);
    } catch {
      showError('加载音色列表失败');
    } finally {
      if (!keepLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadVoices();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
      }
    };
  }, []);

  const presetVoices = useMemo(
    () => voices.filter((voice) => voice.is_preset || voice.voice_type === 'preset'),
    [voices],
  );
  const customVoices = useMemo(() => voices.filter((voice) => !voice.is_preset), [voices]);
  const trainingVoices = useMemo(
    () => customVoices.filter((voice) => voice.status === 'pending' || voice.status === 'training'),
    [customVoices],
  );

  useEffect(() => {
    if (trainingVoices.length === 0) return;

    const timer = window.setInterval(async () => {
      try {
        const updates = await Promise.all(
          trainingVoices.map(async (voice) => {
            const status = await getVoiceTrainingStatus(voice.id);
            return { id: voice.id, status };
          }),
        );

        setVoices((prev) =>
          prev.map((voice) => {
            const hit = updates.find((item) => item.id === voice.id);
            if (!hit) return voice;
            return {
              ...voice,
              status: hit.status.status,
              training_progress: hit.status.progress,
              estimated_time: hit.status.estimated_time,
            };
          }),
        );
      } catch {
        // Silent polling failure, keep UI responsive.
      }
    }, 4000);

    return () => window.clearInterval(timer);
  }, [trainingVoices]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
      currentObjectUrlRef.current = null;
    }
    setPlayingId(null);
  };

  const handlePreview = async (voice: VoiceProfile) => {
    if (playingId === voice.id) {
      stopAudio();
      return;
    }

    setPreviewingId(voice.id);
    try {
      stopAudio();
      const blob = await previewVoice({
        voice_id: voice.id,
        text: previewText.trim() || '你好，很高兴认识你。',
      });
      const url = URL.createObjectURL(blob);
      currentObjectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => stopAudio();
      await audio.play();
      setPlayingId(voice.id);
    } catch {
      showError('试听失败，请稍后重试');
      stopAudio();
    } finally {
      setPreviewingId(null);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showError('请输入音色名称');
      return;
    }
    if (!audioFile) {
      showError('请先上传参考音频');
      return;
    }

    setCreating(true);
    try {
      const voice = await createVoiceProfile({
        name: name.trim(),
        language,
        clone_mode: cloneMode,
        reference_audio: audioFile,
      });

      if (cloneMode === 'training') {
        await startVoiceTraining(voice.id);
      }

      showSuccess(cloneMode === 'training' ? '音色已创建并开始训练' : '音色创建成功');
      setName('');
      setAudioFile(null);
      await loadVoices(true);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      showError(typeof detail === 'string' ? detail : '创建音色失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (voice: VoiceProfile) => {
    const ok = window.confirm(`确定删除音色「${voice.name}」吗？`);
    if (!ok) return;

    try {
      await deleteVoiceProfile(voice.id);
      showSuccess('音色已删除');
      setVoices((prev) => prev.filter((item) => item.id !== voice.id));
      if (playingId === voice.id) {
        stopAudio();
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      showError(typeof detail === 'string' ? detail : '删除失败');
    }
  };

  const handleStartTraining = async (voice: VoiceProfile) => {
    try {
      await startVoiceTraining(voice.id);
      showSuccess('已开始训练');
      setVoices((prev) =>
        prev.map((item) =>
          item.id === voice.id
            ? { ...item, status: 'training', training_progress: Math.max(item.training_progress, 0.05) }
            : item,
        ),
      );
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      showError(typeof detail === 'string' ? detail : '启动训练失败');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">音色管理</h1>
          <p className="mt-1 text-text-light-secondary dark:text-text-dark-secondary">
            管理预设音色与自定义音色，支持零样本与训练复刻
          </p>
        </div>
        <Link to="/character/create" className="btn-secondary">
          去创建角色并绑定音色
        </Link>
      </div>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">创建新音色</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">音色名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="例如：小夏温柔女声"
              maxLength={40}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">语言</label>
            <select className="input-field" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">复刻方式</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCloneMode('zeroshot')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                cloneMode === 'zeroshot'
                  ? 'bg-gradient-primary text-white'
                  : 'border border-border-light dark:border-border-dark'
              }`}
            >
              零样本（即时可用）
            </button>
            <button
              type="button"
              onClick={() => setCloneMode('training')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                cloneMode === 'training'
                  ? 'bg-gradient-primary text-white'
                  : 'border border-border-light dark:border-border-dark'
              }`}
            >
              训练复刻（质量更高）
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">参考音频（mp3/wav/m4a）</label>
          <input
            type="file"
            accept=".mp3,.wav,.m4a,audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-text-light-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-primary-700 hover:file:bg-primary-100 dark:text-text-dark-secondary dark:file:bg-primary-900/30 dark:file:text-primary-300"
          />
          {audioFile && (
            <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
              已选择：{audioFile.name}
            </p>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className="input-field"
            placeholder="试听文本，例如：你好，很高兴认识你。"
          />
          <button type="button" onClick={handleCreate} disabled={creating} className="btn-primary px-6">
            {creating ? '创建中...' : '创建音色'}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">预设音色</h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((idx) => (
              <div key={idx} className="card h-28 animate-pulse bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {presetVoices.map((voice) => (
              <div key={voice.id} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{voice.name}</p>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {voice.language.toUpperCase()} · 预设
                    </p>
                  </div>
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    内置
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePreview(voice)}
                  disabled={previewingId === voice.id}
                  className="btn-secondary w-full"
                >
                  {playingId === voice.id ? '停止试听' : previewingId === voice.id ? '试听中...' : '试听'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">我的音色</h2>
        {!loading && customVoices.length === 0 ? (
          <div className="card py-10 text-center text-text-light-secondary dark:text-text-dark-secondary">
            还没有自定义音色，先上传一段参考音频创建一个吧。
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {customVoices.map((voice) => {
              const progressPercent = Math.round((voice.training_progress || 0) * 100);
              return (
                <div key={voice.id} className="card space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{voice.name}</p>
                      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        {voice.language.toUpperCase()} · {voice.voice_type === 'cloned_trained' ? '训练复刻' : '零样本'}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(voice.status)}`}>
                      {voice.status}
                    </span>
                  </div>

                  {(voice.status === 'pending' || voice.status === 'training') && (
                    <div className="space-y-1.5">
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-2 rounded-full bg-gradient-primary transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        <span>{progressPercent}%</span>
                        <span>预计剩余：{formatEta(voice.estimated_time)}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => handlePreview(voice)}
                      disabled={previewingId === voice.id}
                      className="btn-secondary"
                    >
                      {playingId === voice.id ? '停止' : previewingId === voice.id ? '试听中' : '试听'}
                    </button>

                    {(voice.status === 'pending' || voice.status === 'failed') && (
                      <button
                        type="button"
                        onClick={() => handleStartTraining(voice)}
                        className="btn-primary"
                      >
                        开始训练
                      </button>
                    )}
                    {(voice.status === 'training' || voice.status === 'ready') && (
                      <button
                        type="button"
                        onClick={() => handleStartTraining(voice)}
                        className="btn-secondary"
                      >
                        重新训练
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(voice)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      删除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
