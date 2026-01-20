/**
 * Authentication and logging middleware
 */

const config = require('../config');

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
 * Basic authentication middleware
 * Uses credentials from config for Proxmox API access
 */
const authenticate = (req, res, next) => {
  // In a production environment, implement proper authentication
  // For now, we use the credentials from config to access Proxmox
  req.proxmoxAuth = {
    username: config.proxmox.username,
    password: config.proxmox.password,
    realm: config.proxmox.realm,
  };
  next();
};

module.exports = {
  requestLogger,
  authenticate,
};
