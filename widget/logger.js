/**
 * Simple logger utility for writing logs to the widget directory
 * This Node.js script can be run separately to write log files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory where this script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const widgetDir = __dirname;

/**
 * Write a log message to a file in the widget directory
 * @param {string} message - The message to log
 * @param {string} [filename='transaction-log.txt'] - The name of the log file
 */
export function writeLog(message, filename = 'transaction-log.txt') {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    // Full path to the log file in the widget directory
    const logFilePath = path.join(widgetDir, filename);
    
    // Append the log entry to the file
    fs.appendFileSync(logFilePath, logEntry);
    
    console.log(`Log written to ${logFilePath}`);
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

/**
 * Write a structured log entry with wallet information
 * @param {string} message - The message to log
 * @param {Object} walletInfo - Wallet information
 * @param {string} [filename='transaction-log.txt'] - The name of the log file
 */
export function writeTransactionLog(message, walletInfo, filename = 'transaction-log.txt') {
  try {
    const timestamp = new Date().toISOString();
    const walletStr = walletInfo 
      ? `wallet(${walletInfo.publicKey}, ${walletInfo.connected ? 'connected' : 'disconnected'})` 
      : 'no_wallet';
    const logEntry = `[${timestamp}] [${walletStr}] ${message}\n`;
    
    // Full path to the log file in the widget directory
    const logFilePath = path.join(widgetDir, filename);
    
    // Append the log entry to the file
    fs.appendFileSync(logFilePath, logEntry);
    
    console.log(`Transaction log written to ${logFilePath}`);
  } catch (error) {
    console.error('Failed to write transaction log:', error);
  }
}

// Example usage (if run directly)
if (process.argv[1] && process.argv[1] === __filename) {
  writeLog('Logger initialized');
  writeTransactionLog('Test transaction', { publicKey: 'test-key', connected: true });
}

// Export default
export default {
  writeLog,
  writeTransactionLog
};