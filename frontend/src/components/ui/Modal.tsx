import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  variant?: 'default' | 'danger';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  variant = 'default',
  children,
  footer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fadeUp">
      <div 
        className="w-full max-w-[520px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col p-6 relative border-t-4"
        style={{ borderTopColor: variant === 'danger' ? '#b91c1c' : '#1a5c38' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-primary/10">
          <h3 className="text-[17px] font-medium text-primary">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-text-muted hover:text-primary transition duration-150 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 text-xs text-text-body overflow-y-auto max-h-[70vh] mb-4">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-primary/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
