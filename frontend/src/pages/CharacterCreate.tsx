import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCharacter, getPersonalityTemplates, type PersonalityTemplate, type CharacterCreateRequest } from '../api/characters';
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

export default function CharacterCreate() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
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
    getPersonalityTemplates().then(setTemplates).catch(() => {});
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '请输入角色名称';
    else if (name.trim().length < 2) newErrors.name = '名称至少2个字符';
    else if (name.trim().length > 20) newErrors.name = '名称最多20个字符';

    if (!description.trim()) newErrors.description = '请输入角色简介';
    else if (description.trim().length < 10) newErrors.description = '简介至少10个字符';
    else if (description.trim().length > 500) newErrors.description = '简介最多500个字符';

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

  const handleSelectTemplate = (template: PersonalityTemplate) => {
    setPersonality(template.personality_text);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data: CharacterCreateRequest = {
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

      const character = await createCharacter(data);
      showSuccess('角色创建成功！');
      navigate(`/character/${character.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || '创建失败，请重试';
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold">创建角色</h1>
        <p className="mt-1 text-text-light-secondary dark:text-text-dark-secondary">
          打造你的专属 AI 伙伴，定制性格、背景和说话风格
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
            className={`input-field ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            placeholder="给角色起个名字（2-20字符）"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: '' })); }}
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
                      : 'border border-border-light bg-surface-light text-text-light hover:bg-gray-50 dark:border-border-dark dark:bg-surface-dark dark:text-text-dark dark:hover:bg-gray-800'
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
                      : 'border border-border-light bg-surface-light text-text-light hover:bg-gray-50 dark:border-border-dark dark:bg-surface-dark dark:text-text-dark dark:hover:bg-gray-800'
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
            className={`input-field min-h-[80px] resize-none ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            placeholder="简单描述这个角色（10-500字符）"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setErrors((prev) => ({ ...prev, description: '' })); }}
            maxLength={500}
            rows={3}
          />
          <div className="mt-1 flex justify-between">
            {errors.description ? (
              <p className="text-sm text-red-500">{errors.description}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              {description.length}/500
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">标签（最多5个）</label>
          <div className="mb-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-0.5 text-primary-400 hover:text-primary-600"
                >
                  ×
                </button>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="btn-secondary text-sm"
                >
                  添加
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TAG_SUGGESTIONS.filter((t) => !tags.includes(t))
                  .slice(0, 10)
                  .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="rounded-full border border-border-light px-2.5 py-0.5 text-xs text-text-light-secondary transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-border-dark dark:text-text-dark-secondary dark:hover:border-primary-400 dark:hover:text-primary-400"
                    >
                      + {tag}
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Personality Settings */}
      <section className="card space-y-5">
        <h2 className="text-lg font-semibold">性格设定</h2>

        {templates.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium">性格模板（快速选择）</label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => handleSelectTemplate(t)}
                  className="rounded-xl border border-border-light p-3 text-left transition-all hover:border-primary-400 hover:shadow-md dark:border-border-dark dark:hover:border-primary-400"
                >
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="mt-0.5 text-xs text-text-light-secondary dark:text-text-dark-secondary line-clamp-2">
                    {t.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">性格描述</label>
          <textarea
            className="input-field min-h-[120px] resize-none"
            placeholder="描述角色的性格特点、说话风格、口头禅、兴趣爱好等"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            rows={5}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">背景故事</label>
          <textarea
            className="input-field min-h-[100px] resize-none"
            placeholder="描述角色的背景故事、成长经历等"
            value={backstory}
            onChange={(e) => setBackstory(e.target.value)}
            rows={4}
          />
        </div>
      </section>

      {/* Advanced Settings */}
      <section className="card space-y-5">
        <h2 className="text-lg font-semibold">高级设定</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">开场白</label>
          <textarea
            className="input-field min-h-[60px] resize-none"
            placeholder="角色首次对话时说的第一句话"
            value={greetingMessage}
            onChange={(e) => setGreetingMessage(e.target.value)}
            rows={2}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">系统提示词（System Prompt）</label>
          <textarea
            className="input-field min-h-[120px] resize-none font-mono text-sm"
            placeholder="高级用户可直接编辑系统提示词。留空时将根据性格描述自动生成。"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={5}
          />
          <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            系统提示词控制 AI 角色的行为方式，留空将根据以上性格设定自动生成
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="btn-primary flex-1 py-3"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              创建中...
            </span>
          ) : (
            '保存为草稿'
          )}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-secondary py-3"
        >
          取消
        </button>
      </div>
    </div>
  );
}
