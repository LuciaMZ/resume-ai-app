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
      className={`glass-card rounded-2xl border border-white/10 p-6 ${
        hover
          ? 'transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-lg hover:shadow-blue-500/10'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
