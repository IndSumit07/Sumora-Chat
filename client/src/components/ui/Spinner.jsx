export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div
      className={`${sizes[size]} rounded-full border-border border-t-accent animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-bg-primary z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="text-2xl font-black gradient-text">◈ Sumora</div>
      <Spinner size="lg" />
    </div>
  </div>
);

export const InlineLoader = ({ text = 'Loading...' }) => (
  <div className="flex items-center gap-3 text-text-muted py-4 justify-center">
    <Spinner size="sm" />
    <span className="text-sm">{text}</span>
  </div>
);

export default Spinner;
