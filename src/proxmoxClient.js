/**
 * Low-level Proxmox API client
 * Handles HTTPS requests with token authentication
 */

const fetch = require('node-fetch');
const https = require('https');
const config = require('./config');

// Disable SSL verification if configured
const agent = new https.Agent({
  rejectUnauthorized: config.proxmox.verifySsl,
});

class ProxmoxClient {
  constructor() {
    this.baseUrl = `https://${config.proxmox.host}:${config.proxmox.port}/api2/json`;
    this.authHeader = `PVEAPIToken=${config.proxmox.user}!${config.proxmox.tokenName}=${config.proxmox.tokenValue}`;
  }

  /**
   * Generic API request method
   */
  async request(method, path, body = null) {
    const url = `${this.baseUrl}${path}`;

    const options = {
      method,
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      agent,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.data || `Proxmox API error: ${response.status} ${response.statusText}`
        );
      }

      return data.data || data;
    } catch (error) {
      throw new Error(`Proxmox API request failed: ${error.message}`);
    }
  }

  /** GET /nodes - List all nodes */
  async getNodes() {
    return this.request('GET', '/nodes');
  }

  /** GET /nodes/:node - Get node details */
  async getNodeStatus(node) {
    return this.request('GET', `/nodes/${node}/status`);
  }

  /** GET /nodes/:node/qemu - List QEMU VMs */
  async getNodeQemuVMs(node) {
    return this.request('GET', `/nodes/${node}/qemu`);
  }

  /** GET /nodes/:node/lxc - List LXC containers */
  async getNodeLxcContainers(node) {
    return this.request('GET', `/nodes/${node}/lxc`);
  }

  /** GET /nodes/:node/:type/:vmid/status/current - VM status */
  async getVMStatus(node, vmid, type = 'qemu') {
    return this.request('GET', `/nodes/${node}/${type}/${vmid}/status/current`);
  }

  /** GET /storage - List storage pools */
  async getStorage() {
    return this.request('GET', '/storage');
  }

  /** GET /cluster/status - Cluster status */
  async getClusterStatus() {
    return this.request('GET', '/cluster/status');
  }

  /**
   * POST /nodes/:node/:type/:vmid/status/current - Execute command on VM
   * Uses Proxmox guest agent to run commands inside VM/container
   */
  async executeVMCommand(node, vmid, command, type = 'qemu') {
    const path = `/nodes/${node}/${type}/${vmid}/status/current`;
    return this.request('POST', path, {
      command,
    });
  }

  /** GET /cluster/resources - Cluster resources overview */
  async getClusterResources() {
    return this.request('GET', '/cluster/resources');
  }
}

// Export singleton instance
const proxmoxClient = new ProxmoxClient();
module.exports = proxmoxClient;
