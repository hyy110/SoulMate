import apiClient from './client';

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  audio_url: string | null;
  token_count: number | null;
  metadata_json?: {
    tool_events?: ToolEvent[];
  } | null;
  created_at: string;
}

export interface ToolEvent {
  tool_id: string;
  tool_name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown> | string;
}

export interface Conversation {
  id: string;
  character_id: string;
  user_id: string;
  title: string | null;
  character_name: string;
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

export interface PaginatedMessages {
  items: Message[];
  has_more: boolean;
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await apiClient.get<Conversation[]>('/conversations');
  return res.data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await apiClient.get<Conversation>(`/conversations/${id}`);
  return res.data;
}

export async function createConversation(data: CreateConversationRequest): Promise<Conversation> {
  const res = await apiClient.post<Conversation>('/conversations', data);
  return res.data;
}

export async function updateConversation(id: string, data: { title?: string }): Promise<Conversation> {
  const res = await apiClient.put<Conversation>(`/conversations/${id}`, data);
  return res.data;
}

export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(`/conversations/${id}`);
}

export async function getMessages(
  conversationId: string,
  limit = 50,
  before?: string,
): Promise<PaginatedMessages> {
  const res = await apiClient.get<PaginatedMessages>(
    `/conversations/${conversationId}/messages`,
    { params: { limit, before } },
  );
  return res.data;
}

export async function sendMessage(conversationId: string, data: SendMessageRequest): Promise<Message> {
  const res = await apiClient.post<Message>(
    `/conversations/${conversationId}/messages`,
    data,
  );
  return res.data;
}

export async function clearMessages(conversationId: string): Promise<void> {
  await apiClient.post(`/conversations/${conversationId}/clear`);
}

export async function deleteMessage(conversationId: string, messageId: string): Promise<void> {
  await apiClient.delete(`/conversations/${conversationId}/messages/${messageId}`);
}
