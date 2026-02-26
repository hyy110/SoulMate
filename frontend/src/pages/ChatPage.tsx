import { useParams } from 'react-router-dom';

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-light p-4 dark:border-border-dark">
        <h1 className="text-lg font-semibold">对话</h1>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          会话 ID: {conversationId}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {/* Messages will be rendered here */}
      </div>
      <div className="border-t border-border-light p-4 dark:border-border-dark">
        {/* Message input will be here */}
      </div>
    </div>
  );
}
