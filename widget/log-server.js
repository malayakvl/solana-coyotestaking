/**
 * Simple HTTP server for receiving log messages and writing them to files
 * Run this server to enable logging from the browser widget to the widget directory
 */

import http from 'http';
import { writeTransactionLog } from './logger.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory where this script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const widgetDir = __dirname;

const PORT = 8081; // Changed from 8080 to avoid conflicts

// Create the HTTP server
const server = http.createServer((req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Parse the request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      // Parse the JSON payload
      const payload = JSON.parse(body);
      const { message, walletInfo, filename = 'transaction-log.txt' } = payload;

      // Write the log using our logger utility
      writeTransactionLog(message, walletInfo, filename);

      // Send success response
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ success: true, message: 'Log written successfully' }));

    } catch (error) {
      console.error('Error processing log request:', error);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ error: 'Failed to process log request' }));
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Log server running at http://localhost:${PORT}/`);
  console.log(`Widget directory: ${widgetDir}`);
  console.log('Send POST requests to / with JSON payload:');
  console.log('{ "message": "Your log message", "walletInfo": { "publicKey": "...", "connected": true } }');
});