/**
 * Production-ready logging utility
 * In production, consider integrating with services like:
 * - Sentry for error tracking
 * - LogRocket for session replay
 * - Datadog for observability
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (this.isDevelopment) {
      // In development, use console for better readability
      const consoleMethod = level === "error" ? console.error : 
                           level === "warn" ? console.warn :
                           level === "debug" ? console.debug : console.log;
      consoleMethod(`[${timestamp}] [${level.toUpperCase()}]`, message, context || "");
    } else {
      // In production, output structured JSON for log aggregation
      console.log(JSON.stringify(logEntry));
    }

    // TODO: In production, send critical errors to error tracking service
    // if (level === "error") {
    //   // Sentry.captureException(new Error(message), { extra: context });
    // }
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    this.log("error", error instanceof Error ? error.message : String(error), errorContext);
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log("debug", message, context);
    }
  }
}

export const logger = new Logger();
