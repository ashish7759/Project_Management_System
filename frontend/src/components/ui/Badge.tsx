import React from 'react';

interface BadgeProps {
  variant?: 'completed' | 'inprogress' | 'pending' | 'delayed' | 'default';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  children, 
  className = '' 
}) => {
  let badgeStyles = 'inline-flex items-center gap-1 text-[11px] font-medium py-[3px] px-[10px] rounded-full border';
  let inlineStyle: React.CSSProperties = {};

  switch (variant) {
    case 'completed':
      inlineStyle = { 
        background: 'var(--badge-success-bg)', 
        color: 'var(--badge-success-txt)', 
        borderColor: 'rgba(26,92,56,0.3)' 
      };
      break;
    case 'inprogress':
    case 'pending':
      inlineStyle = { 
        background: 'var(--badge-warning-bg)', 
        color: 'var(--badge-warning-txt)', 
        borderColor: 'rgba(201,168,76,0.25)' 
      };
      break;
    case 'delayed':
      inlineStyle = { 
        background: 'var(--badge-danger-bg)', 
        color: 'var(--badge-danger-txt)', 
        borderColor: 'rgba(185,28,28,0.2)' 
      };
      break;
    default:
      inlineStyle = { 
        background: 'var(--bg-surface-hover)', 
        color: 'var(--text-muted)', 
        borderColor: 'var(--border-default)' 
      };
      break;
  }

  return (
    <span className={`${badgeStyles} ${className}`} style={inlineStyle}>
      {children}
    </span>
  );
};

export default Badge;
