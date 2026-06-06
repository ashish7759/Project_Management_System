import React from 'react';

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
  let baseStyles = 'inline-flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 focus:outline-none select-none active:scale-[0.98]';
  let variantStyles = '';

  switch (variant) {
    case 'primary':
      variantStyles = 'bg-primary text-white hover:bg-primary-dark border-none border-b-2 border-accent';
      break;
    case 'secondary':
      variantStyles = 'bg-white text-primary border border-primary hover:bg-[#f0f7f3]';
      break;
    case 'accent':
      variantStyles = 'bg-accent text-white hover:bg-accent-dark border-none';
      break;
    case 'danger':
      variantStyles = 'bg-white text-danger border border-danger hover:bg-danger-bg';
      break;
    case 'icon':
      variantStyles = 'bg-transparent text-primary hover:bg-primary-bg-2 rounded-md p-1.5 active:scale-95';
      baseStyles = 'inline-flex items-center justify-center transition-all duration-200 focus:outline-none';
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
      className={`${baseStyles} ${variantStyles} ${paddingStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
