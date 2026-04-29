import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createCharacterKnowledgeBase,
  deleteCharacterKnowledgeBase,
  deleteKnowledgeDocument,
  getCharacterKnowledgeBase,
  getKnowledgeDocuments,
  reindexKnowledgeBase,
  searchKnowledgeBase,
  uploadKnowledgeDocument,
  type KnowledgeBase,
  type KnowledgeDocument,
  type KnowledgeSearchResult,
} from '../api/knowledge';
import { showError, showSuccess } from '../components/UI/Toast';

const ACCEPTED_TYPES = '.pdf,.txt,.md,.docx';

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CharacterKnowledge() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const indexedCount = useMemo(
    () => documents.filter((d) => d.status === 'indexed').length,
    [documents],
  );
  const totalChunks = useMemo(
    () => documents.reduce((sum, d) => sum + d.chunk_count, 0),
    [documents],
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const kb = await getCharacterKnowledgeBase(id);
        if (cancelled) return;
        setKnowledgeBase(kb);
        const docs = await getKnowledgeDocuments(kb.id);
        if (!cancelled) setDocuments(docs);
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          showError('加载知识库失败');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleCreate = async () => {
    if (!id || creating) return;
    setCreating(true);
    try {
      const kb = await createCharacterKnowledgeBase(id, {
        name: '默认知识库',
        description: '用于增强角色对话回答',
      });
      setKnowledgeBase(kb);
      setDocuments([]);
      showSuccess('知识库创建成功');
    } catch (err: any) {
      showError(err?.response?.data?.detail || '创建知识库失败');
    } finally {
      setCreating(false);
    }
  };

  const handleUploadFiles = async (files: File[]) => {
    if (!knowledgeBase || uploading || files.length === 0) return;
    setUploading(true);
    try {
      const uploadedDocs: KnowledgeDocument[] = [];
      for (const file of files) {
        const doc = await uploadKnowledgeDocument(knowledgeBase.id, file);
        uploadedDocs.push(doc);
      }
      setDocuments((prev) => [...uploadedDocs, ...prev]);
      showSuccess(`已上传 ${uploadedDocs.length} 个文档`);
    } catch (err: any) {
      showError(err?.response?.data?.detail || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!knowledgeBase) return;
    try {
      await deleteKnowledgeDocument(knowledgeBase.id, documentId);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      showSuccess('文档已删除');
    } catch {
      showError('删除文档失败');
    }
  };

  const handleReindex = async () => {
    if (!knowledgeBase || reindexing) return;
    setReindexing(true);
    try {
      const res = await reindexKnowledgeBase(knowledgeBase.id);
      const docs = await getKnowledgeDocuments(knowledgeBase.id);
      setDocuments(docs);
      showSuccess(`重建完成，已索引 ${res.indexed_documents} 个文档`);
    } catch {
      showError('重建索引失败');
    } finally {
      setReindexing(false);
    }
  };

  const handleSearch = async () => {
    if (!knowledgeBase || !searchQuery.trim()) return;
    try {
      const results = await searchKnowledgeBase(knowledgeBase.id, searchQuery.trim());
      setSearchResults(results);
    } catch {
      showError('检索失败');
    }
  };

  const handleDeleteKnowledgeBase = async () => {
    if (!id) return;
    if (!confirm('确认删除该角色的知识库吗？')) return;
    try {
      await deleteCharacterKnowledgeBase(id);
      setKnowledgeBase(null);
      setDocuments([]);
      setSearchResults([]);
      showSuccess('知识库已删除');
    } catch {
      showError('删除知识库失败');
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!knowledgeBase) {
    return (
      <div className="card flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
        <div className="text-5xl">📚</div>
        <h1 className="text-2xl font-bold">还没有知识库</h1>
        <p className="max-w-md text-sm text-text-light-secondary dark:text-text-dark-secondary">
          为角色创建专属知识库后，就可以上传文档并在对话中自动检索增强回答。
        </p>
        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary">
            返回
          </button>
          <button onClick={handleCreate} disabled={creating} className="btn-primary">
            {creating ? '创建中...' : '创建知识库'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{knowledgeBase.name}</h1>
            <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {knowledgeBase.description || '暂无描述'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReindex} disabled={reindexing} className="btn-secondary">
              {reindexing ? '重建中...' : '重建索引'}
            </button>
            <button onClick={handleDeleteKnowledgeBase} className="btn-secondary text-red-500">
              删除知识库
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card text-center ring-1 ring-primary-100 dark:ring-primary-900/40">
          <p className="text-2xl font-bold text-primary-600">{documents.length}</p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">文档数</p>
        </div>
        <div className="card text-center ring-1 ring-primary-100 dark:ring-primary-900/40">
          <p className="text-2xl font-bold text-primary-600">{indexedCount}</p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">已索引</p>
        </div>
        <div className="card text-center ring-1 ring-primary-100 dark:ring-primary-900/40">
          <p className="text-2xl font-bold text-primary-600">{totalChunks}</p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">分块总数</p>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">上传文档</h2>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleUploadFiles(Array.from(e.dataTransfer.files || []));
          }}
          className={`rounded-xl border-2 border-dashed p-5 transition-colors ${
            dragOver
              ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20'
              : 'border-border-light dark:border-border-dark'
          }`}
        >
          <div className="mb-2 flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            <span>📄</span>
            <span>拖拽文件到这里，或点击选择（支持多文件）</span>
          </div>
          <input
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            disabled={uploading}
            onChange={(e) => handleUploadFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm"
          />
          <p className="mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            支持 PDF/TXT/MD/DOCX，单个文件最大 20MB
          </p>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">文档列表</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">暂无文档</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-xl border border-border-light px-3 py-2 dark:border-border-dark"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.filename}</p>
                  <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    {doc.file_type.toUpperCase()} · {formatFileSize(doc.file_size)} · 分块 {doc.chunk_count}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">
                    {doc.status === 'indexed' ? '已索引' : doc.status === 'error' ? '失败' : '处理中'}
                  </span>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">检索测试</h2>
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入查询关键词"
            className="input-field flex-1"
          />
          <button onClick={handleSearch} className="btn-primary">
            搜索
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((result, idx) => (
              <div key={`${result.document_id}-${idx}`} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
                <p className="text-xs font-medium text-primary-600">
                  {result.filename} · chunk #{result.chunk_index} · score {result.score}
                </p>
                <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {result.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
