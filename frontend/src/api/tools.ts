import apiClient from './client';

export interface Tool {
  id: string;
  name: string;
  description?: string;
  tool_type: string;
  parameters?: Record<string, unknown>;
  is_enabled: boolean;
}

export interface CreateToolRequest {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
  webhook_url?: string;
}

export async function getBuiltinTools(): Promise<Tool[]> {
  const res = await apiClient.get<Tool[]>('/tools/builtin');
  return res.data;
}

export async function createCustomTool(body: CreateToolRequest): Promise<Tool> {
  const res = await apiClient.post<Tool>('/tools', body);
  return res.data;
}

export async function getCharacterTools(characterId: string): Promise<Tool[]> {
  const res = await apiClient.get<Tool[]>(`/characters/${characterId}/tools`);
  return res.data;
}

export async function bindCharacterTools(characterId: string, toolIds: string[]): Promise<Tool[]> {
  const res = await apiClient.put<Tool[]>(`/characters/${characterId}/tools`, {
    tool_ids: toolIds,
  });
  return res.data;
}
