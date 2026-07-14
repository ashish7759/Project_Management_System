import React, { useState } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'icon';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  className = '', 
  children, 
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  let baseStyles = 'inline-flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 focus:outline-none select-none active:scale-[0.98] cursor-pointer';
  let inlineStyle: React.CSSProperties = {};

  switch (variant) {
    case 'primary':
      // Primary button (stays always green — do NOT change)
      inlineStyle = {
        background: isHovered ? '#145030' : '#1a5c38',
        color: '#ffffff',
        border: 'none',
        borderBottom: '2px solid var(--color-accent)',
      };
      break;
    case 'secondary':
      inlineStyle = {
        background: isHovered ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-default)',
      };
      break;
    case 'accent':
      inlineStyle = {
        background: isHovered ? 'var(--color-accent-d)' : 'var(--color-accent)',
        color: '#ffffff',
        border: 'none',
      };
      break;
    case 'danger':
      inlineStyle = {
        background: isHovered ? 'var(--badge-danger-bg)' : 'var(--bg-surface)',
        color: 'var(--badge-danger-txt)',
        border: '1px solid var(--badge-danger-txt)',
      };
      break;
    case 'icon':
      inlineStyle = {
        background: isHovered ? 'var(--bg-surface-hover)' : 'transparent',
        color: 'var(--text-primary)',
        border: 'none',
      };
      baseStyles = 'inline-flex items-center justify-center transition-all duration-200 focus:outline-none rounded-md p-1.5 active:scale-95 cursor-pointer';
      break;
  }

  // Padding overrides based on variants
  const paddingStyles = variant === 'icon' 
    ? '' 
    : variant === 'secondary' 
      ? 'py-[0.6rem] px-[1.2rem]' 
      : variant === 'accent' 
        ? 'py-[0.6rem] px-[1.2rem]' 
        : 'py-[0.6rem] px-[1.4rem]';

  return (
    <button 
      className={`${baseStyles} ${paddingStyles} ${className}`}
      style={inlineStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
