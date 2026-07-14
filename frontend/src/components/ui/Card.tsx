import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  accentLeft?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  accentLeft = false,
  className = '',
  children,
}) => {
  return (
    <div 
      className={`rounded-[10px] p-5 ${className}`}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderLeft: accentLeft ? '3px solid var(--color-accent)' : '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      {(title || subtitle) && (
        <div className="pb-3 mb-4 border-b border-primary/8" style={{ borderBottomColor: 'var(--border-subtle)' }}>
          {title && <h3 className="text-[15px] font-medium" style={{ color: 'var(--text-heading)' }}>{title}</h3>}
          {subtitle && <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
