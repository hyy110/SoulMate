import apiClient from './client';

export interface VoiceProfile {
  id: string;
  name: string;
  language: string;
  provider: string;
  voice_type: 'preset' | 'cloned_zeroshot' | 'cloned_trained' | string;
  status: 'pending' | 'training' | 'ready' | 'failed' | string;
  training_progress: number;
  estimated_time: number | null;
  reference_audio_url: string | null;
  created_at: string | null;
  is_preset: boolean;
}

export interface VoiceTrainingStatus {
  voice_id: string;
  status: string;
  progress: number;
  estimated_time: number | null;
}

export interface VoiceCallSession {
  session_id: string;
  conversation_id: string;
  ws_url: string;
}

export interface CreateVoiceRequest {
  name: string;
  language: string;
  clone_mode: 'zeroshot' | 'training';
  reference_audio?: File;
}

export interface VoicePreviewRequest {
  voice_id: string;
  text: string;
}

export async function getVoices(): Promise<VoiceProfile[]> {
  const res = await apiClient.get<VoiceProfile[]>('/voices');
  return res.data;
}

export async function getPresetVoices(): Promise<VoiceProfile[]> {
  const res = await apiClient.get<VoiceProfile[]>('/voices/presets');
  return res.data;
}

export async function getVoice(id: string): Promise<VoiceProfile> {
  const res = await apiClient.get<VoiceProfile>(`/voices/${id}`);
  return res.data;
}

export async function createVoiceProfile(data: CreateVoiceRequest): Promise<VoiceProfile> {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('language', data.language);
  formData.append('clone_mode', data.clone_mode);
  if (data.reference_audio) {
    formData.append('reference_audio', data.reference_audio);
  }

  const res = await apiClient.post<VoiceProfile>('/voices', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export async function deleteVoiceProfile(id: string): Promise<void> {
  await apiClient.delete(`/voices/${id}`);
}

export async function startVoiceTraining(id: string): Promise<{ message: string; voice_id: string }> {
  const res = await apiClient.post<{ message: string; voice_id: string }>(`/voices/${id}/train`);
  return res.data;
}

export async function getVoiceTrainingStatus(id: string): Promise<VoiceTrainingStatus> {
  const res = await apiClient.get<VoiceTrainingStatus>(`/voices/${id}/train/status`);
  return res.data;
}

export async function previewVoice(data: VoicePreviewRequest): Promise<Blob> {
  const res = await apiClient.post('/voices/preview', data, {
    responseType: 'blob',
  });
  return res.data as Blob;
}

// Backward-compatible voice call API wrappers.
export async function startVoiceCall(conversationId: string): Promise<VoiceCallSession> {
  const res = await apiClient.post<VoiceCallSession>(`/voice/call/${conversationId}/start`);
  return res.data;
}

export async function endVoiceCall(sessionId: string): Promise<void> {
  await apiClient.post(`/voice/call/${sessionId}/end`);
}
