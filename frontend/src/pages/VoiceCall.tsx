import { useParams } from 'react-router-dom';

export default function VoiceCall() {
  const { conversationId } = useParams<{ conversationId: string }>();

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">语音通话</h1>
      <p className="mt-2 text-text-light-secondary dark:text-text-dark-secondary">
        会话 ID: {conversationId}
      </p>
    </div>
  );
}
