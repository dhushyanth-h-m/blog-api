/**
 * A wrapper for async route handlers to catch errors
 * and pass them to the global error handler. 
 * 
 * Avoids repetitive try...catch blocks in controllers
 */

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;