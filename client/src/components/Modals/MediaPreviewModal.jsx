import { useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { useUIStore } from '../../store/uiStore.js';

export default function MediaPreviewModal() {
  const { mediaPreview, closeMediaPreview } = useUIStore();

  useEffect(() => {
    if (mediaPreview) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => {
        if (e.key === 'Escape') closeMediaPreview();
      };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [mediaPreview, closeMediaPreview]);

  if (!mediaPreview) return null;

  return (
    <div 
      className="fixed inset-0 z-toast bg-black/90 backdrop-blur-sm flex flex-col animate-fade-in"
      onClick={closeMediaPreview}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <span className="text-white font-medium truncate max-w-[70%]">
          {mediaPreview.name || 'Media Preview'}
        </span>
        <div className="flex items-center gap-4">
          <a
            href={mediaPreview.url}
            download={mediaPreview.name || 'download'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-white/70 hover:text-white transition-colors"
          >
            <Download size={24} />
          </a>
          <button
            onClick={closeMediaPreview}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X size={28} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        {mediaPreview.type === 'image' && (
          <img
            src={mediaPreview.url}
            alt="Preview"
            className="max-w-full max-h-full object-contain animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {mediaPreview.type === 'video' && (
          <video
            src={mediaPreview.url}
            controls
            autoPlay
            className="max-w-full max-h-full outline-none animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
}
