import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className,
}) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full mx-4',
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          'relative w-full bg-bg-sidebar border border-border rounded-2xl shadow-modal animate-scale-in',
          sizes[size],
          'mx-4',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="btn-icon text-text-muted hover:text-text-primary"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={cn(!title && showCloseButton && 'pt-12', 'relative')}>
          {!title && showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 btn-icon text-text-muted hover:text-text-primary z-10"
            >
              <X size={18} />
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
