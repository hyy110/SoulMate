import { useParams } from 'react-router-dom';

export default function UserPage() {
  const { userId } = useParams<{ userId: string }>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">用户主页</h1>
      <p className="text-text-light-secondary dark:text-text-dark-secondary">
        用户 ID: {userId}
      </p>
    </div>
  );
}
