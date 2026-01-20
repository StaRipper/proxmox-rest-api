/**
 * VM management routes
 * GET /vms - List all VMs/containers
 * GET /vms/:node/:vmid - Get VM/container status
 * POST /vms/:node/:vmid/command - Execute command on VM (elevated)
 */

const express = require('express');
const proxmoxClient = require('../proxmoxClient');
const { requireElevated } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /vms
 * List all VMs and containers across cluster
 * Query params: node (filter by node), type ('qemu'|'lxc'|'all')
 * BASIC mode
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { node: filterNode, type = 'all' } = req.query;

    const nodesData = await proxmoxClient.getNodes();
    const nodes = nodesData.map((n) => n.node);

    const nodesToFetch = filterNode ? [filterNode] : nodes;

    const allVMs = [];

    for (const nodeName of nodesToFetch) {
      try {
        if (type === 'all' || type === 'qemu') {
          try {
            const qemuVMs = await proxmoxClient.getNodeQemuVMs(nodeName);
            allVMs.push(
              ...qemuVMs.map((vm) => formatVMResponse(vm, nodeName, 'qemu'))
            );
          } catch (e) {
            // ignore node without qemu
          }
        }

        if (type === 'all' || type === 'lxc') {
          try {
            const lxcContainers =
              await proxmoxClient.getNodeLxcContainers(nodeName);
            allVMs.push(
              ...lxcContainers.map((ct) => formatVMResponse(ct, nodeName, 'lxc'))
            );
          } catch (e) {
            // ignore node without lxc
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not fetch VMs from node ${nodeName}`);
      }
    }

    allVMs.sort((a, b) => parseInt(a.vmid) - parseInt(b.vmid));

    res.json({
      success: true,
      data: allVMs,
    });
  })
);

/**
 * GET /vms/:node/:vmid
 * Get detailed status of specific VM/container
 * Query param: type ('qemu'|'lxc', default 'qemu')
 * BASIC mode
 */
router.get(
  '/:node/:vmid',
  asyncHandler(async (req, res) => {
    const { node, vmid } = req.params;
    const { type = 'qemu' } = req.query;

    const vmStatus = await proxmoxClient.getVMStatus(node, vmid, type);

    const response = {
      vmid: vmStatus.vmid?.toString(),
      name: vmStatus.name,
      node,
      status: vmStatus.status,
      type,
      uptime: vmStatus.uptime ? formatUptime(vmStatus.uptime) : 'N/A',
      cpu: vmStatus.cpus ? `${(vmStatus.cpus * 100).toFixed(1)}%` : 'N/A',
      memory: vmStatus.maxmem
        ? `${formatBytes(vmStatus.mem || 0)} / ${formatBytes(vmStatus.maxmem)}`
        : 'N/A',
      diskRead: formatBytes(vmStatus.diskread || 0),
      diskWrite: formatBytes(vmStatus.diskwrite || 0),
      networkIn: formatBytes(vmStatus.netin || 0),
      networkOut: formatBytes(vmStatus.netout || 0),
    };

    res.json({
      success: true,
      data: response,
    });
  })
);

/**
 * POST /vms/:node/:vmid/command
 * Execute command on VM/container via guest agent
 * Body: { "command": "uptime", "type": "qemu" }
 * ELEVATED mode - requires PROXMOX_ALLOW_ELEVATED=true
 */
router.post(
  '/:node/:vmid/command',
  requireElevated,
  asyncHandler(async (req, res) => {
    const { node, vmid } = req.params;
    const { command, type = 'qemu' } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: command',
      });
    }

    try {
      const result = await proxmoxClient.executeVMCommand(
        node,
        vmid,
        command,
        type
      );

      res.json({
        success: true,
        data: {
          status: 'SUCCESS',
          command,
          node,
          vmid,
          type,
          output: result.message || result || 'Command executed',
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Command execution failed: ${error.message}`,
      });
    }
  })
);

/** Helper: Format VM response */
function formatVMResponse(vm, node, type) {
  return {
    vmid: vm.vmid?.toString(),
    name: vm.name,
    type,
    node,
    status: vm.status,
    uptime: vm.uptime ? formatUptime(vm.uptime) : 'N/A',
    cpu: vm.cpus ? `${(vm.cpus * 100).toFixed(1)}%` : 'N/A',
    memory: vm.maxmem
      ? `${formatBytes(vm.mem || 0)} / ${formatBytes(vm.maxmem)}`
      : 'N/A',
  };
}

/** Helper: Format uptime */
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

/** Helper: Format bytes */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

module.exports = router;
