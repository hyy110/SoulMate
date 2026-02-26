import apiClient from './client';

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  character_id: string;
  user_id: string;
  title: string;
  last_message: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateConversationRequest {
  character_id: string;
}

export interface SendMessageRequest {
  content: string;
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await apiClient.get<Conversation[]>('/conversations');
  return res.data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await apiClient.get<Conversation>(`/conversations/${id}`);
  return res.data;
}

export async function createConversation(
  data: CreateConversationRequest,
): Promise<Conversation> {
  const res = await apiClient.post<Conversation>('/conversations', data);
  return res.data;
}

export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(`/conversations/${id}`);
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const res = await apiClient.get<Message[]>(`/conversations/${conversationId}/messages`);
  return res.data;
}

export async function sendMessage(
  conversationId: string,
  data: SendMessageRequest,
): Promise<Message> {
  const res = await apiClient.post<Message>(
    `/conversations/${conversationId}/messages`,
    data,
  );
  return res.data;
}
