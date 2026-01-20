/**
 * Node routes - handles Proxmox node operations
 */

const express = require('express');
const proxmoxClient = require('../proxmoxClient');
const { asyncHandler } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /nodes - List all nodes
 * Returns basic information about all cluster nodes
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const nodesData = await proxmoxClient.getNodes();

    const nodes = nodesData.map((node) => ({
      node: node.node,
      status: node.status,
      uptime: node.uptime ? formatUptime(node.uptime) : 'unknown',
      cpu: node.cpu ? `${(node.cpu * 100).toFixed(1)}%` : 'N/A',
      memory: node.maxmem
        ? `${formatBytes(node.mem)} / ${formatBytes(node.maxmem)}`
        : 'N/A',
    }));

    res.json({
      success: true,
      data: nodes,
    });
  })
);

/**
 * GET /nodes/:node - Get detailed node status
 * Requires PROXMOX_ALLOW_ELEVATED=true
 */
router.get(
  '/:node',
  asyncHandler(async (req, res) => {
    const { node } = req.params;
    const nodeStatus = await proxmoxClient.getNodeStatus(node);

    const response = {
      node: nodeStatus.nodename || node,
      status: nodeStatus.status,
      uptime: nodeStatus.uptime ? formatUptime(nodeStatus.uptime) : 'unknown',
      cpus: nodeStatus.cpuinfo?.cpus || 0,
      memory: `${formatBytes(nodeStatus.memory?.used || 0)} / ${formatBytes(
        nodeStatus.memory?.total || 0
      )}`,
      disk: `${formatBytes(nodeStatus.rootfs?.used || 0)} / ${formatBytes(
        nodeStatus.rootfs?.total || 0
      )}`,
      load: nodeStatus.loadavg || [0, 0, 0],
      kernelRelease: nodeStatus.kernel || 'unknown',
    };

    res.json({
      success: true,
      data: response,
    });
  })
);

/** Helper: Format uptime seconds to readable string */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '0m';
}

/** Helper: Format bytes to human-readable format */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

module.exports = router;
