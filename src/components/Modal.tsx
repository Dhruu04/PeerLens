import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  zIndex?: number;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth,
  zIndex = 100050
}) => {
  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const targetNode = (typeof document !== 'undefined' && (document.fullscreenElement || document.body)) || document.body;

  return createPortal(
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      style={{ zIndex }}
    >
      <div
        className="modal-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'min(92vh, 880px)',
          ...(maxWidth ? { maxWidth } : {})
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} className="modal-close" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        
        <div 
          className="modal-body" 
          style={{ 
            flex: 1, 
            minHeight: 0, 
            overflowY: 'auto', 
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch' 
          }}
        >
          {children}
        </div>

        {footer && (
          <div className="modal-footer" style={{ flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    targetNode
  );
};
export default Modal;

