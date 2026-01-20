/**
 * VM routes - handles Proxmox virtual machine operations
 */

const express = require('express');
const router = express.Router();
const ProxmoxClient = require('../proxmoxClient');
const { ApiError } = require('../middleware/errorHandler');

/**
 * GET /vms - List all VMs across all nodes
 */
router.get('/', async (req, res, next) => {
  try {
    const client = new ProxmoxClient();
    const vms = await client.getAllVMs();
    
    res.json({
      success: true,
      data: vms,
    });
  } catch (error) {
    next(new ApiError(`Failed to get VMs: ${error.message}`, 500));
  }
});

/**
 * GET /vms/:node/:vmid - Get specific VM information
 */
router.get('/:node/:vmid', async (req, res, next) => {
  try {
    const { node, vmid } = req.params;
    const client = new ProxmoxClient();
    const vm = await client.getVMInfo(node, vmid);
    
    res.json({
      success: true,
      data: vm,
    });
  } catch (error) {
    next(new ApiError(`Failed to get VM info: ${error.message}`, 500));
  }
});

/**
 * POST /vms/:node/:vmid/command - Execute VM command (start, stop, shutdown, reboot)
 */
router.post('/:node/:vmid/command', async (req, res, next) => {
  try {
    const { node, vmid } = req.params;
    const { command } = req.body;
    
    if (!['start', 'stop', 'shutdown', 'reboot'].includes(command)) {
      return next(new ApiError('Invalid command. Use: start, stop, shutdown, or reboot', 400));
    }
    
    const client = new ProxmoxClient();
    const result = await client.executeVMCommand(node, vmid, command);
    
    res.json({
      success: true,
      data: result,
      message: `VM ${command} command executed successfully`,
    });
  } catch (error) {
    next(new ApiError(`Failed to execute VM command: ${error.message}`, 500));
  }
});

module.exports = router;
