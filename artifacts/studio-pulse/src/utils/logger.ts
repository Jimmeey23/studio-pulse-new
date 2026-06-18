/**
 * Centralized Logging Utility
 * 
 * Provides consistent, production-optimized logging across the application.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  source?: string;
}

const isProd = import.meta.env.PROD;
const isVerboseLoggingEnabled = !isProd && import.meta.env.VITE_APP_DEBUG === 'true';

// Log history for debugging (keeps last 50 entries in production, 100 in dev)
const logHistory: LogEntry[] = [];
const MAX_LOG_HISTORY = isProd ? 50 : 100;

const addToHistory = (entry: LogEntry) => {
  logHistory.push(entry);
  if (logHistory.length > MAX_LOG_HISTORY) {
    logHistory.shift();
  }
};

const shouldLog = (level: LogLevel): boolean => {
  // Always keep warnings/errors.
  if (level === 'warn' || level === 'error') return true;

  // Debug/info logs are opt-in to reduce runtime noise and overhead.
  return isVerboseLoggingEnabled;
};

/**
 * Create a logger instance with an optional source identifier
 */
export const createLogger = (source?: string) => ({
  debug: (message: string, data?: any) => {
    if (!shouldLog('debug')) return;
    const entry: LogEntry = { level: 'debug', message, data, timestamp: new Date(), source };
    addToHistory(entry);
    if (data !== undefined) {
      console.debug(`[${source || 'App'}] ${message}`, data);
    } else {
      console.debug(`[${source || 'App'}] ${message}`);
    }
  },

  info: (message: string, data?: any) => {
    if (!shouldLog('info')) return;
    const entry: LogEntry = { level: 'info', message, data, timestamp: new Date(), source };
    addToHistory(entry);
    if (data !== undefined) {
      console.info(`[${source || 'App'}] ${message}`, data);
    } else {
      console.info(`[${source || 'App'}] ${message}`);
    }
  },

  warn: (message: string, data?: any) => {
    if (!shouldLog('warn')) return;
    const entry: LogEntry = { level: 'warn', message, data, timestamp: new Date(), source };
    addToHistory(entry);
    if (data !== undefined) {
      console.warn(`[${source || 'App'}] ${message}`, data);
    } else {
      console.warn(`[${source || 'App'}] ${message}`);
    }
  },

  error: (message: string, error?: any) => {
    const entry: LogEntry = { level: 'error', message, data: error, timestamp: new Date(), source };
    addToHistory(entry);
    // Always log errors
    if (error !== undefined) {
      console.error(`[${source || 'App'}] ${message}`, error);
    } else {
      console.error(`[${source || 'App'}] ${message}`);
    }
  },
});

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Get log history for debugging
 */
export const getLogHistory = (): LogEntry[] => [...logHistory];

/**
 * Clear log history
 */
export const clearLogHistory = () => {
  logHistory.length = 0;
};

/**
 * Export logs as JSON string (useful for bug reports)
 */
export const exportLogs = (): string => {
  return JSON.stringify(logHistory, null, 2);
};

// Attach to window for debugging in development
if (!isProd && typeof window !== 'undefined') {
  (window as any).__appLogs = {
    getHistory: getLogHistory,
    clear: clearLogHistory,
    export: exportLogs,
  };
}
