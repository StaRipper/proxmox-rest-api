/**
 * Main Express server entry point
 * Proxmox REST API - equivalent to gilby125/mcp-proxmox MCP server
 */

const express = require('express');
const config = require('./config');
const { requestLogger } = require('./middleware/auth');
const { errorHandler: centralErrorHandler } = require('./middleware/errorHandler');

// Import routes
const nodesRouter = require('./routes/nodes');
const vmsRouter = require('./routes/vms');
const storageRouter = require('./routes/storage');
const clusterRouter = require('./routes/cluster');
const openApiRouter = require('./routes/openapi');

const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'Proxmox REST API is running',
    config: {
      allowElevated: config.proxmox.allowElevated,
      proxmoxHost: config.proxmox.host,
    },
  });
});

// API Routes
app.use('/nodes', nodesRouter);
app.use('/vms', vmsRouter);
app.use('/storage', storageRouter);
app.use('/cluster', clusterRouter);
app.use('/api', openApiRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /health',
      'GET /nodes',
      'GET /nodes/:node',
      'GET /vms',
      'GET /vms/:node/:vmid',
      'POST /vms/:node/:vmid/command',
      'GET /storage',
      'GET /cluster/health',
      'GET /api/openapi.json',
      'GET /api/docs',
      'GET /api/docs/redoc',
    ],
  });
});

// Error handling middleware
app.use(centralErrorHandler);

// Server startup
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     🚀 Proxmox REST API Server Started                   ║
║                                                          ║
║  Server: http://localhost:${PORT}                           ║
║  Proxmox: ${config.proxmox.host}:${config.proxmox.port}
║  Environment: ${config.server.nodeEnv}                         ║
║  Elevated Mode: ${config.proxmox.allowElevated ? 'ENABLED' : 'DISABLED'}                       ║
║                                                          ║
║  Quick Start:                                           ║
║  curl http://localhost:${PORT}/nodes                      ║
║  curl http://localhost:${PORT}/health                     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
