/**
 * Authentication and logging middleware
 */

const config = require('../config');

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors and pass to error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Request logger middleware
 * Logs incoming requests with timestamp, method, and path
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};

/**
 * Elevated permission checker
 * Validates if elevated operations are allowed
 */
const requireElevated = (req, res, next) => {
  if (!config.proxmox.allowElevated) {
    return res.status(403).json({
      success: false,
      error: 'Elevated operations are disabled. Set PROXMOX_ALLOW_ELEVATED=true to enable.',
    });
  }
  next();
};

module.exports = {
  asyncHandler,
  requestLogger,
  requireElevated,
};
