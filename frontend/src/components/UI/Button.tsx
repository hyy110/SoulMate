import { type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        {
          'btn-primary': variant === 'primary',
          'btn-secondary': variant === 'secondary',
          'rounded-lg text-text-light-secondary hover:bg-gray-100 hover:text-text-light dark:text-text-dark-secondary dark:hover:bg-gray-800 dark:hover:text-text-dark':
            variant === 'ghost',
        },
        {
          'rounded-lg px-3 py-1.5 text-sm': size === 'sm',
          'rounded-xl px-6 py-2.5 text-sm': size === 'md',
          'rounded-xl px-8 py-3 text-base': size === 'lg',
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
