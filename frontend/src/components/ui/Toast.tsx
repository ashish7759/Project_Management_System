import React from 'react';
import { Check, AlertTriangle, X, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onClose,
  className = '',
}) => {
  let bgClass = 'bg-info';
  let icon = <Info size={16} className="text-white shrink-0" />;

  switch (type) {
    case 'success':
      bgClass = 'bg-primary'; // Dark Green Success
      icon = <Check size={16} className="text-white shrink-0" />;
      break;
    case 'warning':
      bgClass = 'bg-accent'; // Golden Warning
      icon = <AlertTriangle size={16} className="text-white shrink-0" />;
      break;
    case 'error':
      bgClass = 'bg-danger'; // Red Error
      icon = <X size={16} className="text-white shrink-0" />;
      break;
    case 'info':
      bgClass = 'bg-info';
      icon = <Info size={16} className="text-white shrink-0" />;
      break;
  }

  return (
    <div className={`flex items-center justify-between gap-3 text-white rounded-lg p-3 text-[13px] shadow-md ${bgClass} ${className}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span>{message}</span>
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="text-white/80 hover:text-white transition duration-150 cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default Toast;
