import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { showError } from '../components/UI/Toast';
import {
  getConversations,
  getConversation,
  getMessages,
  sendMessage,
  type Message,
  type Conversation,
  type ToolEvent,
} from '../api/conversations';
import { getCharacter, type Character } from '../api/characters';

function formatMessageTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return '今天';
  if (date.toDateString() === yesterday.toDateString()) return '昨天';
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}

function shouldShowDateSeparator(current: Message, previous: Message | undefined): boolean {
  if (!previous) return true;
  const a = new Date(current.created_at).toDateString();
  const b = new Date(previous.created_at).toDateString();
  return a !== b;
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2.5">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-pink-500 text-xs font-bold text-white">
        {name.charAt(0)}
      </div>
      <div className="rounded-[18px] rounded-bl-[4px] bg-gray-100 px-4 py-3 dark:bg-gray-800">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  characterName: string;
}

function ToolCallCard({ event }: { event: ToolEvent }) {
  return (
    <div className="mb-2 rounded-xl border border-primary-200 bg-primary-50/80 p-3 text-xs dark:border-primary-900/40 dark:bg-primary-900/20">
      <p className="font-semibold text-primary-700 dark:text-primary-300">
        工具调用 · {event.tool_name}
      </p>
      <p className="mt-1 text-text-light-secondary dark:text-text-dark-secondary">
        参数: {JSON.stringify(event.args)}
      </p>
      <p className="mt-1 text-text-light-secondary dark:text-text-dark-secondary">
        结果: {typeof event.result === 'string' ? event.result : JSON.stringify(event.result)}
      </p>
    </div>
  );
}

function VoiceMessagePlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;
    const onTime = () => {
      if (!audio.duration) return;
      setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [url]);

  const toggle = async () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    await audioRef.current.play();
    setPlaying(true);
  };

  return (
    <div className="mt-2 rounded-lg bg-black/10 p-2 dark:bg-white/10">
      <div className="flex items-center gap-2">
        <button onClick={toggle} className="rounded-full bg-white/80 px-2 py-1 text-[11px] dark:bg-gray-700/80">
          {playing ? '暂停' : '播放'}
        </button>
        <div className="flex flex-1 items-end gap-1">
          {Array.from({ length: 18 }).map((_, idx) => (
            <span
              key={idx}
              className="w-1 rounded-full bg-current/70"
              style={{
                height: `${6 + ((idx % 5) + 1) * 3}px`,
                opacity: progress / 100 >= idx / 18 ? 1 : 0.35,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message, characterName }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const toolEvents = message.metadata_json?.tool_events || [];

  return (
    <div
      className={clsx(
        'flex items-end gap-2.5 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-pink-500 text-xs font-bold text-white">
          {characterName.charAt(0)}
        </div>
      )}
      <div
        className={clsx(
          'max-w-[70%] px-4 py-2.5 text-[15px] leading-relaxed animate-slide-up',
          isUser
            ? 'rounded-[18px] rounded-br-[4px] bg-gradient-to-r from-primary-600 to-pink-500 text-white'
            : 'rounded-[18px] rounded-bl-[4px] bg-gray-100 text-text-light dark:bg-gray-800 dark:text-text-dark',
        )}
      >
        {toolEvents.map((event) => (
          <ToolCallCard key={`${message.id}-${event.tool_id}`} event={event} />
        ))}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {message.audio_url && <VoiceMessagePlayer url={message.audio_url} />}
        <p
          className={clsx(
            'mt-1 text-[11px]',
            isUser ? 'text-right text-white/60' : 'text-text-light-secondary dark:text-text-dark-secondary',
          )}
        >
          {formatMessageTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    async function load() {
      try {
        const [convs, conv, msgRes] = await Promise.all([
          getConversations(),
          getConversation(conversationId!),
          getMessages(conversationId!),
        ]);

        if (cancelled) return;
        setAllConversations(convs);
        setConversation(conv);
        setMessages(msgRes.items);
        setHasMore(msgRes.has_more);

        const char = await getCharacter(conv.character_id);
        if (!cancelled) setCharacter(char);
      } catch (err: any) {
        if (!cancelled) {
          if (err?.code === 'ERR_NETWORK' || !navigator.onLine) {
            showError('网络连接失败，请检查网络');
          } else if (err?.response?.status === 404) {
            showError('对话不存在');
            navigate('/');
          } else {
            showError('加载对话失败');
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [conversationId]);

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !hasMore || loadingMore || messages.length === 0) return;
    const cursor = messages[0]?.id;
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await getMessages(conversationId, 20, cursor);
      setMessages((prev) => [...res.items, ...prev]);
      setHasMore(res.has_more);
    } catch {
      showError('加载更多消息失败');
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, hasMore, loadingMore, messages]);

  useEffect(() => {
    if (!isLoading) scrollToBottom('instant');
  }, [isLoading, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const adjustTextareaHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 150)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText, adjustTextareaHeight]);

  const handleSend = useCallback(async () => {
    const content = inputText.trim();
    if (!content || isSending || !conversationId) return;

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content,
      audio_url: null,
      token_count: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const aiMessage = await sendMessage(conversationId, { content });
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
        const realUserMsg: Message = {
          ...tempUserMsg,
          id: `user-${Date.now()}`,
        };
        return [...withoutTemp, realUserMsg, aiMessage];
      });
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      if (err?.code === 'ERR_NETWORK' || !navigator.onLine) {
        showError('网络连接失败，请检查网络后重试');
      } else if (err?.response?.status === 401) {
        showError('登录已过期，请重新登录');
      } else if (err?.response?.status === 429) {
        showError('请求过于频繁，请稍后再试');
      } else {
        showError('发送失败，请重试');
      }
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, conversationId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const characterName = character?.name || conversation?.character_name || '角色';

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] flex-col">
        <div className="flex items-center gap-3 border-b border-border-light px-4 py-3 dark:border-border-dark">
          <div className="h-5 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden rounded-2xl border border-border-light dark:border-border-dark">
      <aside className="hidden w-72 flex-shrink-0 border-r border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark lg:block">
        <div className="p-4">
          <h2 className="text-sm font-semibold">对话列表</h2>
          <div className="mt-3 space-y-1">
            {allConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className={clsx(
                  'w-full rounded-xl px-3 py-2 text-left transition-colors',
                  conv.id === conversationId
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                )}
              >
                <p className="truncate text-sm font-medium">{conv.character_name}</p>
                <p className="truncate text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  {conv.title || '未命名对话'}
                </p>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border-light bg-surface-light/80 px-4 py-3 backdrop-blur-sm dark:border-border-dark dark:bg-surface-dark/80">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-light-secondary transition-colors hover:bg-gray-100 dark:text-text-dark-secondary dark:hover:bg-gray-800"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-pink-500 text-sm font-bold text-white">
          {characterName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold">{characterName}</h1>
          <div className="flex items-center gap-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            <span className="inline-flex h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
            <span>{conversation?.message_count || 0} 条消息</span>
          </div>
        </div>
        {conversationId && (
          <button
            onClick={() => navigate(`/voice/${conversationId}`)}
            className="rounded-lg border border-border-light px-3 py-1.5 text-sm text-text-light-secondary transition-colors hover:bg-gray-100 dark:border-border-dark dark:text-text-dark-secondary dark:hover:bg-gray-800"
          >
            语音通话
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {hasMore && (
          <div className="mb-4 flex justify-center">
            <button onClick={loadMoreMessages} disabled={loadingMore} className="btn-secondary px-3 py-1.5 text-xs">
              {loadingMore ? '加载中...' : '加载更早消息'}
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500/20 to-pink-500/20">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold">{characterName}</h3>
            <p className="mt-1 max-w-sm text-sm text-text-light-secondary dark:text-text-dark-secondary">
              开始与 {characterName} 的对话吧，发送一条消息试试～
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((msg, idx) => (
              <div key={msg.id}>
                {shouldShowDateSeparator(msg, messages[idx - 1]) && (
                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border-light dark:bg-border-dark" />
                    <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                    <div className="h-px flex-1 bg-border-light dark:bg-border-dark" />
                  </div>
                )}
                <ChatBubble message={msg} characterName={characterName} />
              </div>
            ))}
            {isSending && <TypingIndicator name={characterName} />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border-light bg-surface-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <div className="relative min-h-[44px] flex-1">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息... (Shift+Enter 换行)"
              rows={1}
              className="input-field max-h-[150px] resize-none py-2.5 pr-3"
              disabled={isSending}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className={clsx(
              'flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200',
              inputText.trim() && !isSending
                ? 'bg-gradient-to-r from-primary-600 to-pink-500 text-white shadow-lg shadow-primary-600/25 hover:shadow-xl'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600',
            )}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
