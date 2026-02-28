import apiClient from './client';

export interface KnowledgeBase {
  id: string;
  character_id: string;
  name: string;
  description: string;
  document_count: number;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  knowledge_base_id: string;
  title: string;
  content: string;
  file_type: string;
  chunk_count: number;
  created_at: string;
}

export interface CreateKnowledgeBaseRequest {
  character_id: string;
  name: string;
  description: string;
}

export async function getKnowledgeBases(characterId: string): Promise<KnowledgeBase[]> {
  const res = await apiClient.get<KnowledgeBase[]>(
    `/knowledge/character/${characterId}`,
  );
  return res.data;
}

export async function createKnowledgeBase(
  data: CreateKnowledgeBaseRequest,
): Promise<KnowledgeBase> {
  const res = await apiClient.post<KnowledgeBase>('/knowledge', data);
  return res.data;
}

export async function deleteKnowledgeBase(id: string): Promise<void> {
  await apiClient.delete(`/knowledge/${id}`);
}

export async function getDocuments(knowledgeBaseId: string): Promise<Document[]> {
  const res = await apiClient.get<Document[]>(`/knowledge/${knowledgeBaseId}/documents`);
  return res.data;
}

export async function uploadDocument(
  knowledgeBaseId: string,
  file: File,
): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post<Document>(
    `/knowledge/${knowledgeBaseId}/documents`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data;
}

export async function deleteDocument(
  knowledgeBaseId: string,
  documentId: string,
): Promise<void> {
  await apiClient.delete(`/knowledge/${knowledgeBaseId}/documents/${documentId}`);
}
