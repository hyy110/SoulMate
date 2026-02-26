import { create } from 'zustand';
import type { Message, Conversation } from '../api/conversations';

interface ChatState {
  activeConversation: Conversation | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;

  setActiveConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setStreaming: (isStreaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversation: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',

  setActiveConversation: (conversation) => set({ activeConversation: conversation }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setStreaming: (isStreaming) => set({ isStreaming }),

  setStreamingContent: (content) => set({ streamingContent: content }),

  appendStreamingContent: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),

  clearChat: () =>
    set({
      activeConversation: null,
      messages: [],
      isStreaming: false,
      streamingContent: '',
    }),
}));
