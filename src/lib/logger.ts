/**
 * Centralized logging utility for verbose app-wide logging
 * Captures errors, warnings, info, and debug messages with context
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = Record<string, any>;

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory
  private isDevelopment = import.meta.env.DEV;

  private createEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      stack: error?.stack,
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  private formatMessage(entry: LogEntry): string {
    const contextStr = entry.context ? `\n${JSON.stringify(entry.context, null, 2)}` : '';
    const stackStr = entry.stack ? `\n${entry.stack}` : '';
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${stackStr}`;
  }

  debug(message: string, context?: LogContext) {
    const entry = this.createEntry('debug', message, context);
    this.addLog(entry);
    if (this.isDevelopment) {
      console.debug(this.formatMessage(entry));
    }
  }

  info(message: string, context?: LogContext) {
    const entry = this.createEntry('info', message, context);
    this.addLog(entry);
    console.info(this.formatMessage(entry));
  }

  warn(message: string, context?: LogContext) {
    const entry = this.createEntry('warn', message, context);
    this.addLog(entry);
    console.warn(this.formatMessage(entry));
  }

  error(message: string, error?: Error, context?: LogContext) {
    const entry = this.createEntry('error', message, context, error);
    this.addLog(entry);
    console.error(this.formatMessage(entry));
  }

  // Get all logs (for debugging/export)
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  // Clear all logs
  clearLogs() {
    this.logs = [];
    console.info('[Logger] Logs cleared');
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();

// Global error handler
window.addEventListener('error', (event) => {
  logger.error('Uncaught error', event.error, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason, {
    promise: event.promise,
  });
});
