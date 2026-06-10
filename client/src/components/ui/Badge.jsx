import { cn } from '../../utils/cn.js';

export const Badge = ({ count, className }) => {
  if (!count || count === 0) return null;
  return (
    <span className={cn('badge animate-notification-bounce', className)}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

export const StatusBadge = ({ status, className }) => {
  const colors = {
    online: 'bg-online',
    offline: 'bg-offline',
    away: 'bg-warning',
  };

  return (
    <span
      className={cn(
        'inline-block w-2.5 h-2.5 rounded-full',
        colors[status] || colors.offline,
        className
      )}
    />
  );
};

export const RoleBadge = ({ role }) => {
  const roles = {
    admin: { label: 'Admin', className: 'bg-accent/20 text-accent border border-accent/30' },
    'co-admin': { label: 'Co-admin', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
    member: { label: 'Member', className: 'bg-bg-hover text-text-muted border border-border' },
  };

  const config = roles[role] || roles.member;

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium',
      config.className
    )}>
      {config.label}
    </span>
  );
};

export default Badge;
