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
  let cardStyles = 'bg-white border border-primary/12 rounded-[10px] p-5 shadow-sm';
  if (accentLeft) {
    cardStyles += ' border-l-[3px] border-l-accent';
  }

  return (
    <div className={`${cardStyles} ${className}`}>
      {(title || subtitle) && (
        <div className="border-b border-primary/8 pb-3 mb-4">
          {title && <h3 className="text-[15px] font-medium text-primary">{title}</h3>}
          {subtitle && <p className="text-[12px] text-text-muted mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
