import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  variant?: 'default' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  variant = 'default',
  size = 'md',
  children,
  footer,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-[400px]',
    md: 'max-w-[520px]',
    lg: 'max-w-[720px]',
    xl: 'max-w-[900px]',
    '2xl': 'max-w-[1100px]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fadeUp">
      <div 
        className={`w-full ${sizeClasses[size] || 'max-w-[520px]'} rounded-xl overflow-hidden flex flex-col p-6 relative border-t-4`}
        style={{ 
          background: 'var(--bg-elevated)',
          borderTopColor: variant === 'danger' ? '#b91c1c' : 'var(--color-primary)',
          boxShadow: 'var(--shadow-modal)'
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderBottomColor: 'var(--border-subtle)' }}>
          <h3 className="text-[17px] font-medium font-outfit" style={{ color: 'var(--text-heading)' }}>
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:text-primary transition duration-150 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 text-xs overflow-y-auto max-h-[70vh] mb-4" style={{ color: 'var(--text-body)' }}>
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 pt-4 border-t" style={{ borderTopColor: 'var(--border-subtle)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
