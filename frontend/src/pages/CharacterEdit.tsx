import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCharacter, updateCharacter, getPersonalityTemplates, type PersonalityTemplate, type CharacterUpdateRequest } from '../api/characters';
import { showSuccess, showError } from '../components/UI/Toast';

const GENDERS = [
  { value: 'female', label: '女' },
  { value: 'male', label: '男' },
  { value: 'other', label: '其他' },
];

const RELATIONSHIP_TYPES = [
  { value: 'girlfriend', label: '女友' },
  { value: 'boyfriend', label: '男友' },
  { value: 'friend', label: '朋友' },
  { value: 'custom', label: '自定义' },
];

const TAG_SUGGESTIONS = [
  '温柔', '可爱', '活泼', '高冷', '治愈', '搞笑', '知性',
  '傲娇', '元气', '文艺', '暖心', '毒舌', '腹黑', '天然呆',
];

export default function CharacterEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState<PersonalityTemplate[]>([]);

  const [name, setName] = useState('');
  const [gender, setGender] = useState('female');
  const [relationshipType, setRelationshipType] = useState('girlfriend');
  const [description, setDescription] = useState('');
  const [personality, setPersonality] = useState('');
  const [backstory, setBackstory] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    Promise.all([getCharacter(id), getPersonalityTemplates()])
      .then(([char, tmpls]) => {
        setName(char.name);
        setGender(char.gender);
        setRelationshipType(char.relationship_type);
        setDescription(char.description || '');
        setPersonality(char.personality || '');
        setBackstory(char.backstory || '');
        setGreetingMessage(char.greeting_message || '');
        setSystemPrompt(char.system_prompt || '');
        setTags(char.tags || []);
        setTemplates(tmpls);
      })
      .catch(() => {
        showError('加载角色信息失败');
        navigate('/');
      })
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '请输入角色名称';
    else if (name.trim().length < 2) newErrors.name = '名称至少2个字符';

    if (!description.trim()) newErrors.description = '请输入角色简介';
    else if (description.trim().length < 10) newErrors.description = '简介至少10个字符';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTag = (tag: string) => {
    const t = tag.trim();
    if (!t || tags.includes(t) || tags.length >= 5) return;
    setTags([...tags, t]);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!id || !validate()) return;

    setIsSaving(true);
    try {
      const data: CharacterUpdateRequest = {
        name: name.trim(),
        gender,
        relationship_type: relationshipType,
        description: description.trim(),
        personality: personality.trim() || undefined,
        backstory: backstory.trim() || undefined,
        greeting_message: greetingMessage.trim() || undefined,
        system_prompt: systemPrompt.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      await updateCharacter(id, data);
      showSuccess('角色已更新');
      navigate(`/character/${id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || '保存失败，请重试';
      showError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="card">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 h-10 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold">编辑角色</h1>
        <p className="mt-1 text-text-light-secondary dark:text-text-dark-secondary">
          修改角色的信息和设定
        </p>
      </div>

      {/* Basic Info */}
      <section className="card space-y-5">
        <h2 className="text-lg font-semibold">基本信息</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">
            角色名称 <span className="text-red-500">*</span>
          </label>
          <input
            className={`input-field ${errors.name ? 'border-red-500' : ''}`}
            placeholder="角色名称"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
            maxLength={20}
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">性别</label>
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    gender === g.value
                      ? 'bg-gradient-primary text-white shadow-md'
                      : 'border border-border-light bg-surface-light hover:bg-gray-50 dark:border-border-dark dark:bg-surface-dark dark:hover:bg-gray-800'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">关系类型</label>
            <div className="flex gap-2">
              {RELATIONSHIP_TYPES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRelationshipType(r.value)}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    relationshipType === r.value
                      ? 'bg-gradient-primary text-white shadow-md'
                      : 'border border-border-light bg-surface-light hover:bg-gray-50 dark:border-border-dark dark:bg-surface-dark dark:hover:bg-gray-800'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            角色简介 <span className="text-red-500">*</span>
          </label>
          <textarea
            className={`input-field min-h-[80px] resize-none ${errors.description ? 'border-red-500' : ''}`}
            placeholder="简单描述这个角色"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: '' })); }}
            maxLength={500}
            rows={3}
          />
          <div className="mt-1 flex justify-between">
            {errors.description ? <p className="text-sm text-red-500">{errors.description}</p> : <span />}
            <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">{description.length}/500</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">标签（最多5个）</label>
          <div className="mb-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-0.5 text-primary-400 hover:text-primary-600">×</button>
              </span>
            ))}
          </div>
          {tags.length < 5 && (
            <>
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="输入标签后回车"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(tagInput); } }}
                />
                <button type="button" onClick={() => handleAddTag(tagInput)} className="btn-secondary text-sm">添加</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TAG_SUGGESTIONS.filter((t) => !tags.includes(t)).slice(0, 10).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="rounded-full border border-border-light px-2.5 py-0.5 text-xs text-text-light-secondary transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-border-dark dark:text-text-dark-secondary"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Personality */}
      <section className="card space-y-5">
        <h2 className="text-lg font-semibold">性格设定</h2>

        {templates.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium">性格模板</label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setPersonality(t.personality_text)}
                  className="rounded-xl border border-border-light p-3 text-left transition-all hover:border-primary-400 hover:shadow-md dark:border-border-dark dark:hover:border-primary-400"
                >
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">性格描述</label>
          <textarea className="input-field min-h-[120px] resize-none" placeholder="描述角色的性格特点" value={personality} onChange={(e) => setPersonality(e.target.value)} rows={5} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">背景故事</label>
          <textarea className="input-field min-h-[100px] resize-none" placeholder="描述角色的背景故事" value={backstory} onChange={(e) => setBackstory(e.target.value)} rows={4} />
        </div>
      </section>

      {/* Advanced */}
      <section className="card space-y-5">
        <h2 className="text-lg font-semibold">高级设定</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">开场白</label>
          <textarea className="input-field min-h-[60px] resize-none" placeholder="角色首次对话时说的第一句话" value={greetingMessage} onChange={(e) => setGreetingMessage(e.target.value)} rows={2} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">系统提示词</label>
          <textarea className="input-field min-h-[120px] resize-none font-mono text-sm" placeholder="高级用户可直接编辑系统提示词" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={5} />
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <button type="button" onClick={handleSubmit} disabled={isSaving} className="btn-primary flex-1 py-3">
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              保存中...
            </span>
          ) : (
            '保存修改'
          )}
        </button>
        <button type="button" onClick={() => navigate(`/character/${id}`)} className="btn-secondary py-3">
          取消
        </button>
      </div>
    </div>
  );
}
