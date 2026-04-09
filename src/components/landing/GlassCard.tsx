import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: 'div' | 'a';
  href?: string;
  target?: string;
  rel?: string;
}

export function GlassCard({
  children,
  className = '',
  hover = true,
  as: Tag = 'div',
  ...rest
}: GlassCardProps) {
  return (
    <Tag
      className={`glass-card rounded-2xl border border-[var(--color-border)] p-6 ${
        hover
          ? 'transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-lg hover:shadow-slate-300/50'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
