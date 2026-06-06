import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col items-start">
      {label && (
        <label className="text-[13px] font-medium text-primary mb-1 select-none">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full bg-white border rounded-lg py-[0.6rem] px-[0.9rem] text-[13px] text-text-body placeholder-text-hint focus:outline-none transition-all duration-150 ${
          error 
            ? 'border-2 border-danger focus:border-danger' 
            : 'border-primary/25 focus:border-2 focus:border-primary focus:ring-4 focus:ring-primary/10'
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="text-[12px] text-danger mt-1">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
