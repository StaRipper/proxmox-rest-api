/**
 * Storage management routes
 * GET /storage - List storage pools
 */

const express = require('express');
const proxmoxClient = require('../proxmoxClient');
const { asyncHandler } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /storage
 * List all storage pools and usage
 * Query param: node (optional, filter by node)
 * BASIC mode
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { node: filterNode } = req.query;

    const storageData = await proxmoxClient.getStorage();

    const storages = storageData
      .filter((storage) => {
        if (filterNode && storage.nodes) {
          return storage.nodes.includes(filterNode);
        }
        return true;
      })
      .map((storage) => formatStorageResponse(storage))
      .filter((s) => s !== null);

    res.json({
      success: true,
      data: storages,
    });
  })
);

/** Helper: Format storage response */
function formatStorageResponse(storage) {
  if (storage.disable || !storage.content) {
    return null;
  }

  const used = storage.used || 0;
  const total = storage.total || 1;
  const percentage = total > 0 ? ((used / total) * 100).toFixed(1) : 0;

  return {
    storage: storage.storage,
    nodes: Array.isArray(storage.nodes) ? storage.nodes.join(', ') : storage.nodes || 'all',
    type: storage.type,
    content: storage.content,
    usage: `${formatBytes(used)} / ${formatBytes(total)} (${percentage}%)`,
    status: storage.enabled !== undefined
      ? storage.enabled
        ? 'enabled'
        : 'disabled'
      : 'enabled',
    available: total > 0,
  };
}

/** Helper: Format bytes */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = router;
