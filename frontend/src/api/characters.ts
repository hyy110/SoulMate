import apiClient from './client';

export interface Character {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  greeting: string;
  personality: string;
  system_prompt: string;
  is_public: boolean;
  creator_id: string;
  tags: string[];
  conversation_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface CharacterCreateRequest {
  name: string;
  description: string;
  avatar_url?: string;
  greeting: string;
  personality: string;
  system_prompt: string;
  is_public?: boolean;
  tags?: string[];
}

export interface CharacterUpdateRequest extends Partial<CharacterCreateRequest> {}

export interface CharacterListParams {
  page?: number;
  page_size?: number;
  search?: string;
  tag?: string;
  sort_by?: 'popular' | 'newest' | 'name';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export async function getCharacters(
  params?: CharacterListParams,
): Promise<PaginatedResponse<Character>> {
  const res = await apiClient.get<PaginatedResponse<Character>>('/characters', { params });
  return res.data;
}

export async function getCharacter(id: string): Promise<Character> {
  const res = await apiClient.get<Character>(`/characters/${id}`);
  return res.data;
}

export async function createCharacter(data: CharacterCreateRequest): Promise<Character> {
  const res = await apiClient.post<Character>('/characters', data);
  return res.data;
}

export async function updateCharacter(
  id: string,
  data: CharacterUpdateRequest,
): Promise<Character> {
  const res = await apiClient.put<Character>(`/characters/${id}`, data);
  return res.data;
}

export async function deleteCharacter(id: string): Promise<void> {
  await apiClient.delete(`/characters/${id}`);
}

export async function getMyCharacters(): Promise<Character[]> {
  const res = await apiClient.get<Character[]>('/characters/mine');
  return res.data;
}

export async function toggleFavorite(id: string): Promise<{ favorited: boolean }> {
  const res = await apiClient.post<{ favorited: boolean }>(`/characters/${id}/favorite`);
  return res.data;
}
