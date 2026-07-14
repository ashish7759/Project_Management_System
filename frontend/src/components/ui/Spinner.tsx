import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  fullPage?: boolean;
  label?: string;
  size?: number;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  fullPage = false,
  label = 'Loading...',
  size = 32,
  className = '',
}) => {
  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Loader2 
        size={size} 
        className="animate-spin" 
        style={{ color: 'var(--text-primary)' }}
      />
      {label && (
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

export default Spinner;
