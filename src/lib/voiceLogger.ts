/**
 * Centralized Voice Logger
 * Provides structured, verbose logging for voice sessions (onboarding & assistant)
 * with timing, context tracking, and debug mode toggle
 */

export type VoiceLogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type VoiceLogCategory = 
  | 'session'      // Session lifecycle
  | 'connection'   // WebSocket/connection events  
  | 'audio'        // Microphone/speaker status
  | 'message'      // User/AI transcripts
  | 'tool'         // Client tool execution
  | 'context'      // Context injection
  | 'state'        // Aperture state changes
  | 'realtime'     // Supabase realtime events
  | 'error';       // Errors and exceptions

export type AgentType = 'onboarding' | 'assistant';

interface VoiceLogEntry {
  timestamp: string;
  level: VoiceLogLevel;
  category: VoiceLogCategory;
  agentType: AgentType;
  conversationId: string;
  message: string;
  data?: any;
  duration?: number;
}

interface Timer {
  start: number;
  elapsed: () => number;
}

class VoiceLogger {
  private logs: VoiceLogEntry[] = [];
  private currentConversationId: string = '';
  private currentAgentType: AgentType = 'assistant';
  private maxLogs = 1000; // Prevent memory overflow

  /**
   * Check if verbose logging is enabled
   */
  isEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('kaeva_voice_debug') === 'true';
  }

  /**
   * Set current conversation context
   */
  setContext(conversationId: string, agentType: AgentType) {
    this.currentConversationId = conversationId;
    this.currentAgentType = agentType;
  }

  /**
   * Clear current context
   */
  clearContext() {
    this.currentConversationId = '';
  }

  /**
   * Start a timer for operation duration tracking
   */
  startTimer(): Timer {
    const start = Date.now();
    return {
      start,
      elapsed: () => Date.now() - start
    };
  }

  /**
   * Core logging function
   */
  private log(
    level: VoiceLogLevel,
    category: VoiceLogCategory,
    message: string,
    data?: any
  ) {
    if (!this.isEnabled()) return;

    const entry: VoiceLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      agentType: this.currentAgentType,
      conversationId: this.currentConversationId,
      message,
      data
    };

    this.logs.push(entry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with emoji and color coding
    const emoji = this.getCategoryEmoji(category);
    const color = this.getLevelColor(level);
    const prefix = `[${entry.timestamp}] ${level} [${category}] [${this.currentAgentType}] ${this.currentConversationId}`;
    
    console.log(
      `%c${emoji} ${prefix} - ${message}`,
      `color: ${color}; font-weight: bold`
    );
    
    if (data !== undefined) {
      console.log(`  └─`, data);
    }
  }

  /**
   * Get emoji for log category
   */
  private getCategoryEmoji(category: VoiceLogCategory): string {
    const emojis: Record<VoiceLogCategory, string> = {
      session: '🎤',
      connection: '🔌',
      audio: '🔊',
      message: '💬',
      tool: '🔧',
      context: '🧠',
      state: '🎭',
      realtime: '⚡',
      error: '❌'
    };
    return emojis[category] || '📝';
  }

  /**
   * Get color for log level
   */
  private getLevelColor(level: VoiceLogLevel): string {
    const colors: Record<VoiceLogLevel, string> = {
      DEBUG: '#888',
      INFO: '#0ea5e9',
      WARN: '#f59e0b',
      ERROR: '#ef4444'
    };
    return colors[level];
  }

  /**
   * Debug level logging
   */
  debug(category: VoiceLogCategory, message: string, data?: any) {
    this.log('DEBUG', category, message, data);
  }

  /**
   * Info level logging
   */
  info(category: VoiceLogCategory, message: string, data?: any) {
    this.log('INFO', category, message, data);
  }

  /**
   * Warning level logging
   */
  warn(category: VoiceLogCategory, message: string, data?: any) {
    this.log('WARN', category, message, data);
  }

  /**
   * Error level logging
   */
  error(category: VoiceLogCategory, message: string, data?: any) {
    this.log('ERROR', category, message, data);
  }

  /**
   * Log full error object with stack trace
   */
  logError(category: VoiceLogCategory, message: string, error: Error | unknown) {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error as any)
    } : error;

    this.log('ERROR', category, message, errorData);
  }

  /**
   * Export all logs for debugging
   */
  dumpSession(): VoiceLogEntry[] {
    return [...this.logs];
  }

  /**
   * Export logs as JSON for download
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Get logs for specific conversation
   */
  getConversationLogs(conversationId: string): VoiceLogEntry[] {
    return this.logs.filter(log => log.conversationId === conversationId);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: VoiceLogCategory): VoiceLogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 10): VoiceLogEntry[] {
    return this.logs
      .filter(log => log.level === 'ERROR')
      .slice(-count);
  }
}

// Export singleton instance
export const voiceLog = new VoiceLogger();
