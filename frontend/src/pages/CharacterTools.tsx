import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  bindCharacterTools,
  createCustomTool,
  getBuiltinTools,
  getCharacterTools,
  type Tool,
} from '../api/tools';
import { showError, showSuccess } from '../components/UI/Toast';

export default function CharacterTools() {
  const { id } = useParams<{ id: string }>();
  const [builtinTools, setBuiltinTools] = useState<Tool[]>([]);
  const [boundTools, setBoundTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [schema, setSchema] = useState('{"type":"object","properties":{}}');
  const [webhook, setWebhook] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getBuiltinTools(), getCharacterTools(id)])
      .then(([builtin, bound]) => {
        setBuiltinTools(builtin);
        setBoundTools(bound);
      })
      .catch(() => showError('加载工具失败'))
      .finally(() => setLoading(false));
  }, [id]);

  const selectedIds = useMemo(() => new Set(boundTools.map((t) => t.id)), [boundTools]);

  const toggleTool = async (toolId: string) => {
    if (!id || saving) return;
    const next = new Set(selectedIds);
    if (next.has(toolId)) {
      next.delete(toolId);
    } else {
      next.add(toolId);
    }
    setSaving(true);
    try {
      const updated = await bindCharacterTools(id, Array.from(next));
      setBoundTools(updated);
      showSuccess('工具绑定已更新');
    } catch {
      showError('更新工具绑定失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustom = async () => {
    if (!id) return;
    if (!name.trim()) {
      showError('请输入工具名称');
      return;
    }
    let parsedSchema: Record<string, unknown> = {};
    try {
      parsedSchema = JSON.parse(schema);
    } catch {
      showError('参数 Schema 不是有效 JSON');
      return;
    }

    try {
      const tool = await createCustomTool({
        name: name.trim(),
        description: description.trim() || undefined,
        parameters: parsedSchema,
        webhook_url: webhook.trim() || undefined,
      });
      const updated = await bindCharacterTools(id, [...Array.from(selectedIds), tool.id]);
      setBoundTools(updated);
      setName('');
      setDescription('');
      setWebhook('');
      showSuccess('自定义工具创建并绑定成功');
    } catch {
      showError('创建自定义工具失败');
    }
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="text-2xl font-bold">工具管理</h1>
        <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          为角色启用内置工具，或创建并绑定自定义工具。
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">内置工具</h2>
        <div className="space-y-2">
          {builtinTools.map((tool) => (
            <label
              key={tool.id}
              className="flex cursor-pointer items-start justify-between rounded-xl border border-border-light p-3 dark:border-border-dark"
            >
              <div>
                <p className="font-medium">{tool.name}</p>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  {tool.description}
                </p>
              </div>
              <input
                type="checkbox"
                checked={selectedIds.has(tool.id)}
                disabled={saving}
                onChange={() => toggleTool(tool.id)}
                className="mt-1 h-4 w-4"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">创建自定义工具</h2>
        <input
          className="input-field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="工具名称"
        />
        <input
          className="input-field"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="工具描述"
        />
        <input
          className="input-field"
          value={webhook}
          onChange={(e) => setWebhook(e.target.value)}
          placeholder="Webhook URL (可选)"
        />
        <textarea
          className="input-field min-h-[120px] font-mono text-xs"
          value={schema}
          onChange={(e) => setSchema(e.target.value)}
          placeholder="JSON Schema"
        />
        <button onClick={handleCreateCustom} className="btn-primary">
          创建并绑定
        </button>
      </section>
    </div>
  );
}
