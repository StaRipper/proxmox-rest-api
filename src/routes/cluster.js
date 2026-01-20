/**
 * Cluster management routes
 * GET /cluster/health - Get cluster health status
 */

const express = require('express');
const proxmoxClient = require('../proxmoxClient');
const { asyncHandler } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /cluster/health
 * Get overall cluster health status
 * BASIC mode
 */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const clusterStatus = await proxmoxClient.getClusterStatus();

    const nodes = clusterStatus.filter((item) => item.type === 'node');
    const onlineNodes = nodes.filter((n) => n.online).length;

    const response = {
      status: onlineNodes === nodes.length ? 'healthy' : 'degraded',
      nodesOnline: onlineNodes,
      nodesTotal: nodes.length,
      nodeDetails: nodes.map((node) => ({
        node: node.node,
        status: node.online ? 'online' : 'offline',
        id: node.id,
      })),
    };

    const quorum = clusterStatus.find((item) => item.type === 'quorum');
    if (quorum) {
      response.quorum = {
        votes: quorum.votes || 0,
        quorumVotes: quorum.quorum_votes || 0,
      };
    }

    res.json({
      success: true,
      data: response,
    });
  })
);

module.exports = router;
