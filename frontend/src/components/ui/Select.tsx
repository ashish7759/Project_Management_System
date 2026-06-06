import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col items-start">
      {label && (
        <label className="text-[13px] font-medium text-primary mb-1 select-none">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`w-full bg-white border rounded-lg py-[0.6rem] px-[0.9rem] text-[13px] text-text-body placeholder-text-hint focus:outline-none transition-all duration-150 ${
          error 
            ? 'border-2 border-danger focus:border-danger' 
            : 'border-primary/25 focus:border-2 focus:border-primary focus:ring-4 focus:ring-primary/10'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span className="text-[12px] text-danger mt-1">
          {error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
