import { getInitials, getAvatarColor } from '../../utils/formatters.js';
import { cn } from '../../utils/cn.js';

export const Avatar = ({
  src,
  name,
  size = 'md',
  isOnline,
  className,
  onClick,
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-2xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl',
  };

  const dotSizes = {
    xs: 'w-2 h-2 border',
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-4 h-4 border-2',
    '2xl': 'w-5 h-5 border-2',
  };

  const bgColor = getAvatarColor(name || '?');
  const initials = getInitials(name || '');

  return (
    <div
      className={cn('avatar relative flex-shrink-0', sizes[size], onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className={cn(
          'w-full h-full flex items-center justify-center font-semibold text-white select-none',
          src && 'hidden'
        )}
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </div>

      {/* Online indicator */}
      {isOnline !== undefined && (
        <div
          className={cn(
            'status-dot absolute bottom-0 right-0 rounded-full border-bg-sidebar',
            dotSizes[size],
            isOnline ? 'bg-online' : 'bg-offline/60'
          )}
        />
      )}
    </div>
  );
};

export default Avatar;
