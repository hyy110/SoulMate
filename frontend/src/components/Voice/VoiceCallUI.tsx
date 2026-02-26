import { useVoiceStore } from '../../stores/voiceStore';

export default function VoiceCallUI() {
  const { status, isMuted, duration, toggleMute, endCall } = useVoiceStore();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-primary shadow-lg shadow-primary-600/25">
        <span className="text-4xl text-white">🎙️</span>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
          {status === 'connecting' && '连接中...'}
          {status === 'active' && '通话中'}
          {status === 'ended' && '通话结束'}
          {status === 'error' && '连接错误'}
          {status === 'idle' && '准备就绪'}
        </p>
        {status === 'active' && (
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatDuration(duration)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleMute}
          className={`rounded-full p-4 transition-colors ${
            isMuted
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-gray-100 text-text-light dark:bg-gray-800 dark:text-text-dark'
          }`}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>
        <button
          onClick={endCall}
          className="rounded-full bg-red-500 p-4 text-white shadow-lg transition-colors hover:bg-red-600"
        >
          📞
        </button>
      </div>
    </div>
  );
}
