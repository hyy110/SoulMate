import { create } from 'zustand';

type VoiceCallStatus = 'idle' | 'connecting' | 'active' | 'reconnecting' | 'ended' | 'error';

interface VoiceState {
  isCallActive: boolean;
  status: VoiceCallStatus;
  sessionId: string | null;
  isMuted: boolean;
  isSpeakerOn: boolean;
  duration: number;
  errorMessage: string | null;

  startCall: (sessionId: string) => void;
  endCall: () => void;
  setStatus: (status: VoiceCallStatus) => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  setDuration: (duration: number) => void;
  setError: (message: string | null) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isCallActive: false,
  status: 'idle',
  sessionId: null,
  isMuted: false,
  isSpeakerOn: true,
  duration: 0,
  errorMessage: null,

  startCall: (sessionId) =>
    set({
      isCallActive: true,
      status: 'connecting',
      sessionId,
      duration: 0,
      errorMessage: null,
    }),

  endCall: () =>
    set({
      isCallActive: false,
      status: 'ended',
      sessionId: null,
      isMuted: false,
      duration: 0,
    }),

  setStatus: (status) => set({ status }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  toggleSpeaker: () => set((state) => ({ isSpeakerOn: !state.isSpeakerOn })),

  setDuration: (duration) => set({ duration }),

  setError: (message) =>
    set({ errorMessage: message, status: message ? 'error' : 'idle' }),
}));
