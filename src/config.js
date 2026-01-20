/**
 * Configuration loader from environment variables
 * Validates required settings and provides defaults
 */

require('dotenv').config();

const config = {
  // Proxmox server connection
  proxmox: {
    host: process.env.PROXMOX_HOST,
    port: parseInt(process.env.PROXMOX_PORT || '8006'),
    user: process.env.PROXMOX_USER,
    tokenName: process.env.PROXMOX_TOKEN_NAME,
    tokenValue: process.env.PROXMOX_TOKEN_VALUE,
    verifySsl: process.env.PROXMOX_VERIFY_SSL === 'true' || false,
    allowElevated: process.env.PROXMOX_ALLOW_ELEVATED === 'true' || false,
  },

  // API server
  server: {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
};

/**
 * Validate required configuration
 */
function validateConfig() {
  const required = [
    'proxmox.host',
    'proxmox.user',
    'proxmox.tokenName',
    'proxmox.tokenValue',
  ];

  for (const key of required) {
    const [section, field] = key.split('.');
    const value = config[section][field];
    if (!value) {
      throw new Error(
        `Missing required environment variable: ${key.toUpperCase().replace('.', '_')}`
      );
    }
  }
}

// Validate on load
try {
  validateConfig();
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  process.exit(1);
}

module.exports = config;
