// Centralized Logging Utility

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  timestamp: Date;
}

export class Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      context: this.context,
      data,
      timestamp: new Date()
    };

    const formattedMessage = `[${entry.timestamp.toISOString()}] ${level} [${this.context}] ${message}`;
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data || '');
        break;
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === 'development') {
          console.debug(formattedMessage, data || '');
        }
        break;
    }
  }

  error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  // Convenience methods for common use cases
  apiCall(endpoint: string, method: string, duration: number) {
    this.info(`${method} ${endpoint} completed in ${duration}ms`);
  }

  aiRequest(prompt: string, duration: number) {
    this.debug(`AI request processed in ${duration}ms`, { prompt: prompt.substring(0, 100) });
  }

  databaseQuery(query: string, duration: number) {
    this.debug(`Database query completed in ${duration}ms`, { query });
  }
}

// Global logger instances
export const logger = new Logger('Main');
export const aiLogger = new Logger('AI');
export const dbLogger = new Logger('Database');
export const pdfLogger = new Logger('PDF');
export const emailLogger = new Logger('Email');