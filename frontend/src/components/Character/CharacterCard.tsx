import { Link } from 'react-router-dom';
import type { Character } from '../../api/characters';

interface CharacterCardProps {
  character: Character;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  return (
    <Link to={`/character/${character.id}`} className="card group block">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-gradient-primary" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold group-hover:text-primary-600 dark:group-hover:text-primary-400">
            {character.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {character.description}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            <span>{character.conversation_count} 对话</span>
            <span>{character.like_count} 喜欢</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
