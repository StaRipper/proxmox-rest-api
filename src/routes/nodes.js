/**
 * Node routes - handles Proxmox node operations
 */

const express = require('express');
const router = express.Router();
const ProxmoxClient = require('../proxmoxClient');
const { ApiError } = require('../middleware/errorHandler');

/**
 * GET /nodes - List all nodes
 */
router.get('/', async (req, res, next) => {
  try {
    const client = new ProxmoxClient();
    const nodes = await client.getNodes();
    
    res.json({
      success: true,
      data: nodes,
    });
  } catch (error) {
    next(new ApiError(`Failed to get nodes: ${error.message}`, 500));
  }
});

/**
 * GET /nodes/:node - Get specific node information
 */
router.get('/:node', async (req, res, next) => {
  try {
    const { node } = req.params;
    const client = new ProxmoxClient();
    const nodeInfo = await client.getNodeInfo(node);
    
    res.json({
      success: true,
      data: nodeInfo,
    });
  } catch (error) {
    next(new ApiError(`Failed to get node info: ${error.message}`, 500));
  }
});

module.exports = router;
