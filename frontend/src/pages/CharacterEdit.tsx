import { useParams } from 'react-router-dom';

export default function CharacterEdit() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">编辑角色</h1>
      <p className="text-text-light-secondary dark:text-text-dark-secondary">
        编辑角色 ID: {id}
      </p>
    </div>
  );
}
