import { useCallback } from 'react';
import { useVoiceStore } from '../stores/voiceStore';
import { startVoiceCall, endVoiceCall } from '../api/voice';

interface UseVoiceCallReturn {
  isCallActive: boolean;
  status: string;
  isMuted: boolean;
  duration: number;
  start: (conversationId: string) => Promise<void>;
  end: () => Promise<void>;
  toggleMute: () => void;
}

export function useVoiceCall(): UseVoiceCallReturn {
  const store = useVoiceStore();

  const start = useCallback(async (conversationId: string) => {
    try {
      const session = await startVoiceCall(conversationId);
      store.startCall(session.session_id);
      store.setStatus('active');
    } catch {
      store.setError('无法建立语音连接');
    }
  }, [store]);

  const end = useCallback(async () => {
    const { sessionId } = useVoiceStore.getState();
    if (sessionId) {
      try {
        await endVoiceCall(sessionId);
      } finally {
        store.endCall();
      }
    }
  }, [store]);

  return {
    isCallActive: store.isCallActive,
    status: store.status,
    isMuted: store.isMuted,
    duration: store.duration,
    start,
    end,
    toggleMute: store.toggleMute,
  };
}
