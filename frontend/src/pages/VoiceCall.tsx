import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { endVoiceCall, startVoiceCall, type VoiceCallSession } from '../api/voice';
import { showError } from '../components/UI/Toast';

type CallStatus = 'listening' | 'thinking' | 'speaking' | 'paused' | 'muted';

function formatDuration(seconds: number): string {
  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function statusLabel(status: CallStatus): string {
  if (status === 'listening') return '听你说话中...';
  if (status === 'thinking') return '思考中...';
  if (status === 'speaking') return '说话中...';
  if (status === 'paused') return '已暂停';
  return '已静音';
}

export default function VoiceCall() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<VoiceCallSession | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState<CallStatus>('listening');
  const [subtitle, setSubtitle] = useState('');
  const [micGranted, setMicGranted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  useEffect(() => {
    if (!conversationId) return;
    let disposed = false;

    async function connectCall() {
      try {
        const call = await startVoiceCall(conversationId);
        if (disposed) return;
        setSession(call);
        setConnecting(false);
      } catch {
        if (!disposed) {
          showError('建立语音通话失败');
          navigate(`/chat/${conversationId}`, { replace: true });
        }
      }
    }

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          stream.getTracks().forEach((t) => t.stop());
          if (!disposed) setMicGranted(true);
        })
        .catch(() => {
          if (!disposed) setMicGranted(false);
        });
    }

    connectCall();
    return () => {
      disposed = true;
    };
  }, [conversationId, navigate]);

  useEffect(() => {
    if (connecting || isPaused || showSummary) return;
    const timer = window.setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [connecting, isPaused, showSummary]);

  useEffect(() => {
    if (connecting) return;
    const phaseOrder: CallStatus[] = ['listening', 'thinking', 'speaking'];
    let idx = 0;
    const phrases = [
      '我在听，请继续说~',
      '让我想一想你的问题...',
      '好的，我来回答你。',
    ];

    const timer = window.setInterval(() => {
      if (isPaused) {
        setStatus('paused');
        setSubtitle('通话已暂停，点击继续恢复。');
        return;
      }
      if (isMuted) {
        setStatus('muted');
        setSubtitle('你已静音，AI 暂停接收语音输入。');
        return;
      }
      idx = (idx + 1) % phaseOrder.length;
      const next = phaseOrder[idx];
      setStatus(next);
      setSubtitle(phrases[idx]);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [connecting, isMuted, isPaused]);

  const handleHangUp = async () => {
    try {
      if (session?.session_id) {
        await endVoiceCall(session.session_id);
      }
      setSummaryText(
        `本次通话 ${formatDuration(duration)}，使用音色 ${session?.voice_name || '默认'}，状态切换稳定。`,
      );
      setShowSummary(true);
    } finally {
      window.setTimeout(() => {
        navigate(`/chat/${conversationId}`);
      }, 1400);
    }
  };

  return (
    <div className="relative flex h-full min-h-[680px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top,_#1A0F2E_0%,_#0F0A1A_65%)] p-8 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,_rgba(124,58,237,0.16)_0%,_transparent_65%)]" />

      <div className="relative mb-5 flex h-44 w-44 items-center justify-center">
        <div className="absolute inset-0 animate-pulse rounded-full bg-pink-500/20" />
        <div className="absolute inset-4 rounded-full border border-pink-300/40" />
        <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-white/10 text-5xl font-bold shadow-[0_0_45px_rgba(236,72,153,0.38)]">
          {session?.character_name?.charAt(0) || '语'}
        </div>
      </div>

      <h1 className="text-2xl font-bold">{session?.character_name || '语音通话'}</h1>
      <p className="mt-2 text-sm text-white/70">{connecting ? '连接中...' : `通话时长 ${formatDuration(duration)}`}</p>
      <p className="mt-1 text-xs text-white/60">
        当前音色：{session?.voice_name || '默认'} {session?.is_preset_voice ? '(预设)' : '(自定义)'}
      </p>
      <p className="mt-1 text-xs text-white/55">
        麦克风：{micGranted ? '已授权' : '未授权/不可用'} · 扬声器：{speakerOn ? '开启' : '关闭'}
      </p>
      <p className="mt-5 rounded-full bg-white/10 px-4 py-1.5 text-sm">{statusLabel(status)}</p>
      <p className="mt-2 min-h-6 text-sm text-white/75">{subtitle}</p>

      <div className="mt-6 flex w-full max-w-lg items-end justify-center gap-1 px-4">
        {[14, 28, 18, 36, 24, 40, 22, 34, 16, 26, 19, 31].map((h, i) => (
          <span
            key={`${h}-${i}`}
            className={`w-1.5 rounded-full bg-gradient-to-t from-primary-500 to-pink-400 ${
              !isPaused && !isMuted ? 'animate-pulse' : ''
            }`}
            style={{ height: `${h + (isMuted ? 0 : 6)}px`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => setIsMuted((v) => !v)}
          className={`flex h-12 min-w-24 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors ${
            isMuted ? 'bg-amber-500/80 hover:bg-amber-500' : 'bg-white/20 hover:bg-white/30'
          }`}
        >
          {isMuted ? '取消静音' : '静音'}
        </button>
        <button
          onClick={() => setSpeakerOn((v) => !v)}
          className="flex h-12 min-w-24 items-center justify-center rounded-full bg-white/20 px-4 text-sm font-medium hover:bg-white/30"
        >
          {speakerOn ? '扬声器开' : '扬声器关'}
        </button>
        <button
          onClick={() => setIsPaused((v) => !v)}
          className="flex h-12 min-w-24 items-center justify-center rounded-full bg-white/20 px-4 text-sm font-medium hover:bg-white/30"
        >
          {isPaused ? '继续' : '暂停'}
        </button>
        <button
          onClick={handleHangUp}
          className="flex h-14 min-w-28 items-center justify-center rounded-full bg-red-500 px-4 text-sm font-medium hover:bg-red-600"
        >
          挂断
        </button>
      </div>

      {showSummary && (
        <div className="mt-6 w-full max-w-xl rounded-xl border border-white/20 bg-white/10 p-4 text-center text-sm backdrop-blur">
          <p className="font-semibold">通话摘要</p>
          <p className="mt-1 text-white/80">{summaryText}</p>
        </div>
      )}
    </div>
  );
}
