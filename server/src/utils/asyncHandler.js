/**
 * Wraps an async route/controller so rejected promises are forwarded to
 * Express's error-handling middleware instead of crashing the process.
 */
export function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
