/**
 * Storage routes - handles Proxmox storage operations
 */

const express = require('express');
const router = express.Router();
const ProxmoxClient = require('../proxmoxClient');
const { ApiError } = require('../middleware/errorHandler');

/**
 * GET /storage - List all storage
 */
router.get('/', async (req, res, next) => {
  try {
    const client = new ProxmoxClient();
    const storage = await client.getStorage();
    
    res.json({
      success: true,
      data: storage,
    });
  } catch (error) {
    next(new ApiError(`Failed to get storage: ${error.message}`, 500));
  }
});

/**
 * GET /storage/:storage - Get specific storage information
 */
router.get('/:storage', async (req, res, next) => {
  try {
    const { storage } = req.params;
    const client = new ProxmoxClient();
    const storageInfo = await client.getStorageInfo(storage);
    
    res.json({
      success: true,
      data: storageInfo,
    });
  } catch (error) {
    next(new ApiError(`Failed to get storage info: ${error.message}`, 500));
  }
});

module.exports = router;
