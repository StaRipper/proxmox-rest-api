/**
 * OpenAPI routes - provides OpenAPI documentation
 */

const express = require('express');
const router = express.Router();
const config = require('../config');

/**
 * OpenAPI 3.0 specification for the Proxmox REST API
 */
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Proxmox REST API',
    version: '1.0.0',
    description: 'REST API wrapper for Proxmox VE - HTTP equivalent of gilby125/mcp-proxmox MCP server',
  },
  servers: [
    {
      url: `http://localhost:${config.server.port}`,
      description: 'Development server',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Check if the API server is running',
        responses: {
          200: {
            description: 'Server is healthy',
          },
        },
      },
    },
    '/nodes': {
      get: {
        summary: 'List all nodes',
        description: 'Get a list of all Proxmox nodes',
        responses: {
          200: {
            description: 'List of nodes',
          },
        },
      },
    },
    '/vms': {
      get: {
        summary: 'List all VMs',
        description: 'Get a list of all virtual machines across all nodes',
        responses: {
          200: {
            description: 'List of VMs',
          },
        },
      },
    },
    '/storage': {
      get: {
        summary: 'List all storage',
        description: 'Get a list of all storage configurations',
        responses: {
          200: {
            description: 'List of storage',
          },
        },
      },
    },
    '/cluster/health': {
      get: {
        summary: 'Cluster health',
        description: 'Get cluster health status',
        responses: {
          200: {
            description: 'Cluster health information',
          },
        },
      },
    },
  },
};

/**
 * GET /api/openapi.json - Get OpenAPI specification
 */
router.get('/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

/**
 * GET /api/docs - Swagger UI documentation
 */
router.get('/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Proxmox REST API Documentation</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script>
        SwaggerUIBundle({
          url: '/api/openapi.json',
          dom_id: '#swagger-ui',
        });
      </script>
    </body>
    </html>
  `);
});

/**
 * GET /api/docs/redoc - ReDoc documentation
 */
router.get('/docs/redoc', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Proxmox REST API Documentation</title>
    </head>
    <body>
      <redoc spec-url="/api/openapi.json"></redoc>
      <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
    </body>
    </html>
  `);
});

module.exports = router;
