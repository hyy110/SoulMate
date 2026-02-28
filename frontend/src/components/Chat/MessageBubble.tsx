import clsx from 'clsx';
import type { Message } from '../../api/conversations';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'bg-gradient-primary text-white'
            : 'bg-gray-100 text-text-light dark:bg-gray-800 dark:text-text-dark',
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <span
          className={clsx(
            'mt-1 block text-xs',
            isUser ? 'text-white/70' : 'text-text-light-secondary dark:text-text-dark-secondary',
          )}
        >
          {new Date(message.created_at).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
