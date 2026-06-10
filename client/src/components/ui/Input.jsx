import { forwardRef } from 'react';
import { cn } from '../../utils/cn.js';

export const Input = forwardRef(({
  label,
  error,
  hint,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconClick,
  className,
  containerClassName,
  ...props
}, ref) => {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-text-secondary" htmlFor={props.id}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3 text-text-muted pointer-events-none">
            <LeftIcon size={16} />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'input',
            LeftIcon && 'pl-10',
            RightIcon && 'pr-10',
            error && 'border-danger/50 focus:ring-danger/30 focus:border-danger/50',
            className
          )}
          {...props}
        />
        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 text-text-muted hover:text-text-secondary transition-colors"
          >
            <RightIcon size={16} />
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-danger flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-text-muted">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
