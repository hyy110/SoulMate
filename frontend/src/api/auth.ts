import apiClient from './client';

export interface User {
  id: string;
  username: string;
  email: string;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}

export interface UpdateProfileRequest {
  nickname?: string;
  bio?: string;
  avatar_url?: string;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/login', data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/register', data);
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>('/auth/me');
  return res.data;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  const res = await apiClient.put<User>('/auth/me', data);
  return res.data;
}

export async function refreshToken(refresh_token: string): Promise<AuthTokens> {
  const res = await apiClient.post<AuthTokens>('/auth/refresh', { refresh_token });
  return res.data;
}
