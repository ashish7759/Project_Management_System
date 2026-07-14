import React, { forwardRef, useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  className?: string;
  confidenceScore?: number | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  className = '',
  confidenceScore,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  let borderStyle = '1px solid var(--input-border)';
  if (error) {
    borderStyle = '2px solid var(--badge-danger-txt)';
  } else if (isFocused) {
    borderStyle = '2px solid var(--input-focus)';
  } else if (confidenceScore !== undefined && confidenceScore !== null) {
    if (confidenceScore < 60) {
      borderStyle = '2px solid #b91c1c';
    } else if (confidenceScore < 85) {
      borderStyle = '1.5px solid #c9a84c';
    }
  }

  return (
    <div className="w-full flex flex-col items-start">
      {label && (
        <label 
          className="text-[13px] font-medium mb-1 select-none font-outfit" 
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        style={{
          background   : 'var(--input-bg)',
          border       : borderStyle,
          color        : 'var(--input-text)',
          borderRadius : '8px',
          padding      : '0.6rem 0.9rem',
        }}
        className={`w-full text-[13px] focus:outline-none transition-all duration-150 ${className}`}
        {...props}
      />
      {error && (
        <span className="text-[12px] mt-1" style={{ color: 'var(--badge-danger-txt)' }}>
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
