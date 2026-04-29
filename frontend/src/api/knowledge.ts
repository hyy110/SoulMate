import apiClient from './client';

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  document_count: number;
  embedding_model: string;
  chunk_size: number;
  chunk_overlap: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  knowledge_base_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_url: string;
  chunk_count: number;
  status: 'pending' | 'indexed' | 'error';
  created_at: string;
  metadata_json: Record<string, any> | null;
}

export interface KnowledgeSearchResult {
  document_id: string;
  filename: string;
  chunk_index: number;
  score: number;
  content: string;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
  chunk_size?: number;
  chunk_overlap?: number;
}

export async function getCharacterKnowledgeBase(characterId: string): Promise<KnowledgeBase> {
  const res = await apiClient.get<KnowledgeBase>(`/characters/${characterId}/knowledge-base`);
  return res.data;
}

export async function createCharacterKnowledgeBase(
  characterId: string,
  data: CreateKnowledgeBaseRequest,
): Promise<KnowledgeBase> {
  const res = await apiClient.post<KnowledgeBase>(`/characters/${characterId}/knowledge-base`, data);
  return res.data;
}

export async function deleteCharacterKnowledgeBase(characterId: string): Promise<void> {
  await apiClient.delete(`/characters/${characterId}/knowledge-base`);
}

export async function getKnowledgeDocuments(knowledgeBaseId: string): Promise<KnowledgeDocument[]> {
  const res = await apiClient.get<KnowledgeDocument[]>(`/knowledge-bases/${knowledgeBaseId}/documents`);
  return res.data;
}

export async function uploadKnowledgeDocument(
  knowledgeBaseId: string,
  file: File,
): Promise<KnowledgeDocument> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post<KnowledgeDocument>(
    `/knowledge-bases/${knowledgeBaseId}/documents`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return res.data;
}

export async function deleteKnowledgeDocument(knowledgeBaseId: string, documentId: string): Promise<void> {
  await apiClient.delete(`/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`);
}

export async function reindexKnowledgeBase(knowledgeBaseId: string): Promise<{ message: string; indexed_documents: number }> {
  const res = await apiClient.post<{ message: string; indexed_documents: number }>(`/knowledge-bases/${knowledgeBaseId}/reindex`);
  return res.data;
}

export async function searchKnowledgeBase(
  knowledgeBaseId: string,
  query: string,
): Promise<KnowledgeSearchResult[]> {
  const res = await apiClient.get<KnowledgeSearchResult[]>(`/knowledge-bases/${knowledgeBaseId}/search`, {
    params: { q: query },
  });
  return res.data;
}
