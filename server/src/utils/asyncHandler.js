/**
 * asyncHandler — wraps async controller functions to eliminate try/catch boilerplate.
 * Catches any rejected promise and forwards it to Express error handling middleware.
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
