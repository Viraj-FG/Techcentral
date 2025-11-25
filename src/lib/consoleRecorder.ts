
type LogType = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  type: LogType;
  message: any[];
  stack?: string;
}

class ConsoleRecorder {
  private logs: LogEntry[] = [];
  private originalConsole: any = {};
  private isRecording: boolean = false;
  private maxLogs: number = 2000;

  constructor() {
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    };
  }

  start() {
    if (this.isRecording) return;
    this.isRecording = true;

    (['log', 'warn', 'error', 'info', 'debug'] as LogType[]).forEach((type) => {
      console[type] = (...args: any[]) => {
        // Call original
        if (this.originalConsole[type]) {
            this.originalConsole[type].apply(console, args);
        }

        // Record
        this.addLog(type, args);
      };
    });
    
    this.addLog('info', ['Console recording started']);
    
    // Expose globally for emergency access
    (window as any).kaevaDebug = {
        downloadLogs: () => this.downloadLogs(),
        getLogs: () => this.getLogs(),
        clear: () => this.clear()
    };
  }

  stop() {
    if (!this.isRecording) return;
    
    (['log', 'warn', 'error', 'info', 'debug'] as LogType[]).forEach((type) => {
      console[type] = this.originalConsole[type];
    });
    
    this.isRecording = false;
    this.addLog('info', ['Console recording stopped']);
  }

  private addLog(type: LogType, args: any[]) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      message: args.map(arg => {
        try {
            if (arg instanceof Error) {
                return {
                    message: arg.message,
                    name: arg.name,
                    stack: arg.stack
                };
            }
            return typeof arg === 'object' ? JSON.parse(JSON.stringify(arg)) : String(arg);
        } catch (e) {
            return '[Circular or Unserializable Object]';
        }
      }),
    };

    if (type === 'error') {
        // Capture stack trace for the log call itself if it's an error log
        entry.stack = new Error().stack;
    }

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs() {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }

  downloadLogs() {
    const data = {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        logs: this.logs
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaeva-debug-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const consoleRecorder = new ConsoleRecorder();
