import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
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

const MAX_RECORD_SECONDS = 60;
const MIN_RECORD_SECONDS = 3;

function MicRecorder({ onRecorded }: { onRecorded: (file: File) => void }) {
  const [state, setState] = useState<'idle' | 'recording' | 'done'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => () => {
    cleanup();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
  }, [cleanup, recordedUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : 'ogg';
        const file = new File([blob], `recording.${ext}`, { type: blob.type });

        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        onRecorded(file);
        setState('done');
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };

      recorder.start(250);
      setSeconds(0);
      setState('recording');

      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORD_SECONDS) {
            mediaRecorderRef.current?.stop();
            window.clearInterval(timerRef.current);
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        showError('麦克风权限被拒绝，请在浏览器设置中允许访问麦克风');
      } else {
        showError('无法访问麦克风，请检查设备连接');
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (seconds < MIN_RECORD_SECONDS) {
      showError(`录音至少需要 ${MIN_RECORD_SECONDS} 秒`);
      cleanup();
      setState('idle');
      setSeconds(0);
      return;
    }
    mediaRecorderRef.current?.stop();
  };

  const resetRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setState('idle');
    setSeconds(0);
  };

  const togglePlayback = () => {
    if (!recordedUrl) return;
    if (playbackRef.current && !playbackRef.current.paused) {
      playbackRef.current.pause();
      playbackRef.current.currentTime = 0;
      playbackRef.current = null;
      return;
    }
    const audio = new Audio(recordedUrl);
    playbackRef.current = audio;
    audio.onended = () => { playbackRef.current = null; };
    audio.play();
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={startRecording}
        className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-light py-8 transition-colors hover:border-primary-400 hover:bg-primary-50/50 dark:border-border-dark dark:hover:border-primary-600 dark:hover:bg-primary-900/10"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">点击开始录音</p>
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            对着麦克风说 {MIN_RECORD_SECONDS}-{MAX_RECORD_SECONDS} 秒的话
          </p>
        </div>
      </button>
    );
  }

  if (state === 'recording') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-red-300 bg-red-50/50 py-6 dark:border-red-800 dark:bg-red-900/10">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-red-400/30" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-red-400/20" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="text-2xl font-mono font-bold text-red-600 dark:text-red-400">
            {formatTime(seconds)}
          </p>
          <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            录音中... {seconds < MIN_RECORD_SECONDS
              ? `至少还需 ${MIN_RECORD_SECONDS - seconds} 秒`
              : '点击停止完成录音'}
          </p>
        </div>
        <button
          type="button"
          onClick={stopRecording}
          className="rounded-xl bg-red-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
        >
          停止录音
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border-light bg-gray-50 px-4 py-3 dark:border-border-dark dark:bg-gray-800/50">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium">录音完成</p>
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            时长 {formatTime(seconds)}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={togglePlayback} className="btn-secondary px-3 py-1.5 text-xs">
          试听
        </button>
        <button type="button" onClick={resetRecording} className="btn-secondary px-3 py-1.5 text-xs">
          重录
        </button>
      </div>
    </div>
  );
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
  const [audioSource, setAudioSource] = useState<'upload' | 'record'>('upload');
  const [previewText, setPreviewText] = useState('你好，很高兴认识你。');
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

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

  useEffect(() => {
    if (!audioFile) {
      setAudioPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(audioFile);
    setAudioPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [audioFile]);

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
          <label className="mb-2 block text-sm font-medium">参考音频</label>
          <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => { setAudioSource('upload'); setAudioFile(null); }}
              className={clsx(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                audioSource === 'upload'
                  ? 'bg-white text-text-light shadow-sm dark:bg-gray-700 dark:text-text-dark'
                  : 'text-text-light-secondary hover:text-text-light dark:text-text-dark-secondary dark:hover:text-text-dark',
              )}
            >
              上传文件
            </button>
            <button
              type="button"
              onClick={() => { setAudioSource('record'); setAudioFile(null); }}
              className={clsx(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                audioSource === 'record'
                  ? 'bg-white text-text-light shadow-sm dark:bg-gray-700 dark:text-text-dark'
                  : 'text-text-light-secondary hover:text-text-light dark:text-text-dark-secondary dark:hover:text-text-dark',
              )}
            >
              麦克风录音
            </button>
          </div>

          {audioSource === 'upload' ? (
            <div>
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
          ) : (
            <MicRecorder onRecorded={(file) => setAudioFile(file)} />
          )}

          {audioPreviewUrl && (
            <div className="mt-3 rounded-xl border border-border-light bg-gradient-to-r from-primary-50 to-pink-50 p-3 dark:border-border-dark dark:from-primary-900/20 dark:to-pink-900/20">
              <p className="mb-2 text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                音频波形预览
              </p>
              <div className="mb-2 flex h-12 items-end gap-1">
                {Array.from({ length: 36 }).map((_, idx) => (
                  <span
                    key={idx}
                    className="w-1 rounded-full bg-gradient-to-t from-primary-600 to-pink-500"
                    style={{ height: `${8 + ((idx * 7) % 32)}px`, opacity: 0.45 + ((idx % 5) * 0.1) }}
                  />
                ))}
              </div>
              <audio src={audioPreviewUrl} controls className="w-full" />
            </div>
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
