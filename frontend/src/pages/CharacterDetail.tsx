import { useParams } from 'react-router-dom';

export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">角色详情</h1>
      <p className="text-text-light-secondary dark:text-text-dark-secondary">
        角色 ID: {id}
      </p>
    </div>
  );
}
