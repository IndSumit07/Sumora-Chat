/**
 * Utility function to merge class names (similar to clsx + tailwind-merge)
 */
export const cn = (...classes) => {
  return classes
    .filter(Boolean)
    .join(' ')
    .trim();
};

export default cn;
