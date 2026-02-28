import { create } from 'zustand';
import type { User, LoginRequest, RegisterRequest } from '../api/auth';
import { getMe, login as loginApi, register as registerApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setUser: (user: User) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,

  login: async (data) => {
    set({ isLoading: true });
    try {
      const result = await loginApi(data);
      localStorage.setItem('access_token', result.tokens.access_token);
      localStorage.setItem('refresh_token', result.tokens.refresh_token);
      set({
        user: result.user,
        token: result.tokens.access_token,
        isAuthenticated: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const result = await registerApi(data);
      localStorage.setItem('access_token', result.tokens.access_token);
      localStorage.setItem('refresh_token', result.tokens.refresh_token);
      set({
        user: result.user,
        token: result.tokens.access_token,
        isAuthenticated: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const user = await getMe();
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, token: null, isAuthenticated: false });
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),

  initialize: async () => {
    const token = localStorage.getItem('access_token');
    if (token && !get().user) {
      await get().fetchUser();
    }
  },
}));
