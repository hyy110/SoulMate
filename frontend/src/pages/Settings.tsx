import { useState, useEffect } from 'react';
import clsx from 'clsx';
import apiClient from '../api/client';
import { showSuccess, showError } from '../components/UI/Toast';

const TABS = [
  { key: 'appearance', label: '外观' },
  { key: 'voice', label: '语音' },
  { key: 'account', label: '账号' },
  { key: 'about', label: '关于' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

type ThemeMode = 'light' | 'dark' | 'auto';

function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('theme') as ThemeMode) || 'auto';
  });

  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('theme', theme);

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [theme]);

  return { theme, setTheme: setThemeState };
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('fontSize') || '16', 10);
  });

  useEffect(() => {
    localStorage.setItem('fontSize', String(fontSize));
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  const themeOptions: { key: ThemeMode; label: string; icon: string }[] = [
    { key: 'light', label: '浅色', icon: '☀️' },
    { key: 'dark', label: '深色', icon: '🌙' },
    { key: 'auto', label: '跟随系统', icon: '💻' },
  ];

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div>
        <h3 className="mb-3 text-base font-semibold">主题模式</h3>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setTheme(opt.key)}
              className={clsx(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                theme === opt.key
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-border-light hover:border-gray-300 dark:border-border-dark dark:hover:border-gray-600',
              )}
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div>
        <h3 className="mb-3 text-base font-semibold">字体大小</h3>
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-sm">字体大小: {fontSize}px</span>
            <button
              onClick={() => {
                setFontSize(16);
                showSuccess('已重置为默认大小');
              }}
              className="text-xs text-primary-600 hover:text-primary-500"
            >
              重置
            </button>
          </div>
          <input
            type="range"
            min={12}
            max={20}
            step={1}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="mt-3 w-full accent-primary-600"
          />
          <div className="mt-1 flex justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary">
            <span>小</span>
            <span>默认</span>
            <span>大</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountTab() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const canSubmit = oldPassword && newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 6;

  const handleChangePassword = async () => {
    if (!canSubmit) return;

    if (newPassword !== confirmPassword) {
      showError('两次输入的密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      showError('新密码至少需要 6 个字符');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put('/auth/password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      showSuccess('密码修改成功');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      showError('密码修改失败，请检查原密码是否正确');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-base font-semibold">修改密码</h3>
        <div className="card space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">当前密码</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="输入当前密码"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="输入新密码 (至少 6 位)"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
              className={clsx(
                'input-field',
                confirmPassword && confirmPassword !== newPassword && 'border-red-500 focus:border-red-500',
              )}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="mt-1 text-sm text-red-500">两次输入的密码不一致</p>
            )}
          </div>
          <button
            onClick={handleChangePassword}
            disabled={!canSubmit || saving}
            className="btn-primary w-full py-2.5"
          >
            {saving ? '修改中...' : '修改密码'}
          </button>
        </div>
      </div>
    </div>
  );
}

function VoiceTab() {
  const [asrLanguage, setAsrLanguage] = useState(() => localStorage.getItem('asr_language') || 'zh');
  const [ttsSpeed, setTtsSpeed] = useState(() => parseFloat(localStorage.getItem('tts_speed') || '1.0'));
  const [autoPlayVoice, setAutoPlayVoice] = useState(() => localStorage.getItem('auto_play_voice') !== 'false');

  const handleSave = () => {
    localStorage.setItem('asr_language', asrLanguage);
    localStorage.setItem('tts_speed', String(ttsSpeed));
    localStorage.setItem('auto_play_voice', String(autoPlayVoice));
    showSuccess('语音设置已保存');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-base font-semibold">语音识别 (ASR)</h3>
        <div className="card space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">默认识别语言</label>
            <select
              value={asrLanguage}
              onChange={(e) => setAsrLanguage(e.target.value)}
              className="input-field"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="auto">自动检测</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-semibold">语音合成 (TTS)</h3>
        <div className="card space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">语速: {ttsSpeed.toFixed(1)}x</label>
              <button
                onClick={() => setTtsSpeed(1.0)}
                className="text-xs text-primary-600 hover:text-primary-500"
              >
                重置
              </button>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={ttsSpeed}
              onChange={(e) => setTtsSpeed(Number(e.target.value))}
              className="mt-2 w-full accent-primary-600"
            />
            <div className="mt-1 flex justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary">
              <span>0.5x 慢</span>
              <span>1.0x 正常</span>
              <span>2.0x 快</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">自动播放语音回复</p>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                收到 AI 语音回复时自动播放
              </p>
            </div>
            <button
              onClick={() => setAutoPlayVoice(!autoPlayVoice)}
              className={clsx(
                'relative h-6 w-11 rounded-full transition-colors',
                autoPlayVoice ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600',
              )}
            >
              <span
                className={clsx(
                  'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                  autoPlayVoice && 'translate-x-5',
                )}
              />
            </button>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary w-full py-2.5">
        保存语音设置
      </button>
    </div>
  );
}

function AboutTab() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const [charsRes, convsRes] = await Promise.all([
        apiClient.get('/characters', { params: { page: 1, page_size: 100 } }),
        apiClient.get('/conversations'),
      ]);

      const exportData = {
        export_date: new Date().toISOString(),
        version: '0.1.0',
        characters: charsRes.data.items ?? charsRes.data,
        conversations: convsRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soulmate-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('数据导出成功');
    } catch {
      showError('导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card text-center">
        <div className="mb-4">
          <span className="gradient-text text-3xl font-bold">SoulMate</span>
        </div>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          版本 0.1.0
        </p>
        <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          AI 灵魂伴侣 - 创建和对话你的 AI 角色
        </p>
      </div>

      {/* Data Export */}
      <div className="card space-y-3">
        <h3 className="font-semibold">数据管理</h3>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          导出你的角色和对话数据为 JSON 格式。
        </p>
        <button
          onClick={handleExportData}
          disabled={isExporting}
          className="btn-secondary flex w-full items-center justify-center gap-2 py-2.5"
        >
          {isExporting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          {isExporting ? '导出中...' : '导出数据'}
        </button>
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">相关链接</h3>
        <div className="space-y-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📦</span>
              <span className="text-sm font-medium">GitHub 仓库</span>
            </div>
            <svg className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a
            href="mailto:support@soulmate.ai"
            className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📧</span>
              <span className="text-sm font-medium">联系我们</span>
            </div>
            <svg className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a
            href="#"
            className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📄</span>
              <span className="text-sm font-medium">使用条款</span>
            </div>
            <svg className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a
            href="#"
            className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🔒</span>
              <span className="text-sm font-medium">隐私政策</span>
            </div>
            <svg className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabKey>('appearance');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="mt-1 text-text-light-secondary dark:text-text-dark-secondary">
          管理你的账户和偏好设置
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-white text-text-light shadow-sm dark:bg-gray-700 dark:text-text-dark'
                : 'text-text-light-secondary hover:text-text-light dark:text-text-dark-secondary dark:hover:text-text-dark',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'appearance' && <AppearanceTab />}
      {activeTab === 'voice' && <VoiceTab />}
      {activeTab === 'account' && <AccountTab />}
      {activeTab === 'about' && <AboutTab />}
    </div>
  );
}
