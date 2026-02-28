import apiClient from './client';

export interface Character {
  id: string;
  name: string;
  gender: string;
  relationship_type: string;
  description: string | null;
  personality: string | null;
  backstory: string | null;
  greeting_message: string | null;
  system_prompt: string;
  tags: string[] | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  status: string;
  like_count: number;
  chat_count: number;
  share_count: number;
  conversation_count: number;
  temperature: number;
  max_tokens: number;
  creator_id: string;
  voice_profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CharacterCreateRequest {
  name: string;
  gender: string;
  relationship_type: string;
  description: string;
  personality?: string;
  backstory?: string;
  greeting_message?: string;
  system_prompt?: string;
  tags?: string[];
  avatar_url?: string;
  cover_image_url?: string;
  voice_profile_id?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface CharacterUpdateRequest extends Partial<CharacterCreateRequest> {}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface PersonalityTemplate {
  name: string;
  description: string;
  personality_text: string;
  sample_dialogues: string[];
}

export async function getCharacters(
  page = 1,
  page_size = 10,
  search?: string,
): Promise<PaginatedResponse<Character>> {
  const params: Record<string, any> = { page, page_size };
  if (search) params.search = search;
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

export async function publishCharacter(id: string): Promise<Character> {
  const res = await apiClient.post<Character>(`/characters/${id}/publish`);
  return res.data;
}

export async function cloneCharacter(id: string): Promise<Character> {
  const res = await apiClient.post<Character>(`/characters/${id}/clone`);
  return res.data;
}

export async function getCharacterStats(
  id: string,
): Promise<{ like_count: number; chat_count: number; share_count: number; conversation_count: number }> {
  const res = await apiClient.get(`/characters/${id}/stats`);
  return res.data;
}

export async function likeCharacter(id: string): Promise<{ message: string; liked: boolean }> {
  const res = await apiClient.post(`/characters/${id}/like`);
  return res.data;
}

export async function unlikeCharacter(id: string): Promise<{ message: string; liked: boolean }> {
  const res = await apiClient.delete(`/characters/${id}/like`);
  return res.data;
}

export async function getPersonalityTemplates(): Promise<PersonalityTemplate[]> {
  const res = await apiClient.get<PersonalityTemplate[]>('/characters/personality-templates');
  return res.data;
}
