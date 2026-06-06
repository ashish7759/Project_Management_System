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

  switch (variant) {
    case 'completed':
      badgeStyles += ' bg-primary-bg2 text-primary border-primary/30';
      break;
    case 'inprogress':
      badgeStyles += ' bg-warning-bg text-accent-dark border-accent/40';
      break;
    case 'pending':
      badgeStyles += ' bg-[#fff8e1] text-[#b8860b] border-[#b8860b]/30';
      break;
    case 'delayed':
      badgeStyles += ' bg-danger-bg text-danger border-danger/20';
      break;
    default:
      badgeStyles += ' bg-primary-bg text-primary-light border-primary/20';
      break;
  }

  return (
    <span className={`${badgeStyles} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
