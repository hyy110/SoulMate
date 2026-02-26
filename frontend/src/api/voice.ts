import apiClient from './client';

export interface VoiceProfile {
  id: string;
  character_id: string;
  voice_id: string;
  provider: string;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface VoiceCallSession {
  session_id: string;
  conversation_id: string;
  ws_url: string;
}

export interface TTSRequest {
  text: string;
  voice_id: string;
}

export async function getVoiceProfile(characterId: string): Promise<VoiceProfile> {
  const res = await apiClient.get<VoiceProfile>(`/voice/profile/${characterId}`);
  return res.data;
}

export async function createVoiceProfile(
  characterId: string,
  data: Omit<VoiceProfile, 'id' | 'character_id' | 'created_at'>,
): Promise<VoiceProfile> {
  const res = await apiClient.post<VoiceProfile>(`/voice/profile/${characterId}`, data);
  return res.data;
}

export async function startVoiceCall(conversationId: string): Promise<VoiceCallSession> {
  const res = await apiClient.post<VoiceCallSession>(`/voice/call/${conversationId}/start`);
  return res.data;
}

export async function endVoiceCall(sessionId: string): Promise<void> {
  await apiClient.post(`/voice/call/${sessionId}/end`);
}

export async function textToSpeech(data: TTSRequest): Promise<Blob> {
  const res = await apiClient.post('/voice/tts', data, {
    responseType: 'blob',
  });
  return res.data as Blob;
}
