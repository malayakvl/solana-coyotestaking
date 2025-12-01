# Widget Logging System

This document explains how to set up and use the logging system that writes transaction logs directly to the widget directory.

## Overview

Due to browser security restrictions, client-side JavaScript cannot directly write files to the local filesystem. To overcome this limitation, we've implemented a solution using:

1. A Node.js HTTP server that receives log messages and writes them to files
2. Client-side code that sends log messages to the server

## Setup Instructions

### 1. Start the Log Server

Run the log server to enable writing logs to the widget directory:

```bash
npm run log-server
```

The server will start on `http://localhost:8081/` and listen for log messages.

### 2. Use the Widget

Open the widget in your browser (e.g., by running `npm run dev` and navigating to the appropriate page). The widget will automatically send log messages to the log server.

### 3. View Log Files

Log files will be created in the `widget` directory with timestamped filenames:
- `stake-transaction-YYYY-MM-DDTHH-MM-SS.txt`

## How It Works

1. The widget sends log messages to the log server via HTTP POST requests
2. The log server receives these messages and writes them to files in the widget directory
3. Each log entry includes timestamp and wallet information for traceability

## Log Format

Each log entry follows this format:
```
[YYYY-MM-DDTHH:mm:ss.sssZ] [wallet(publicKey, connected/disconnected)] [MESSAGE]
```

Example:
```
[2023-05-15T14:30:22.123Z] [wallet(5a3xHjE8ZBE7D3c8D6h8F2G1E9h4K3L7M5N2P8Q1R4S6T9U2V, connected)] [STAKE] Starting stake process, amount: 1.0, devMode: false
```

## Troubleshooting

### Server Not Running
If logs aren't appearing in the widget directory, make sure the log server is running:
```bash
npm run log-server
```

### Network Issues
The widget expects the log server to be available at `http://localhost:8081/`. If you need to change this, update the URL in `widget/components/StakePopup.tsx`.

### File Permissions
Ensure the Node.js process has write permissions to the widget directory.