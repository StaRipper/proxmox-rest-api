/**
 * Cluster routes - handles Proxmox cluster operations
 */

const express = require('express');
const router = express.Router();
const ProxmoxClient = require('../proxmoxClient');
const { ApiError } = require('../middleware/errorHandler');

/**
 * GET /cluster/health - Get cluster health status
 */
router.get('/health', async (req, res, next) => {
  try {
    const client = new ProxmoxClient();
    const clusterStatus = await client.getClusterStatus();
    
    res.json({
      success: true,
      data: clusterStatus,
    });
  } catch (error) {
    next(new ApiError(`Failed to get cluster health: ${error.message}`, 500));
  }
});

/**
 * GET /cluster/resources - Get cluster resources
 */
router.get('/resources', async (req, res, next) => {
  try {
    const client = new ProxmoxClient();
    const resources = await client.getClusterResources();
    
    res.json({
      success: true,
      data: resources,
    });
  } catch (error) {
    next(new ApiError(`Failed to get cluster resources: ${error.message}`, 500));
  }
});

module.exports = router;
