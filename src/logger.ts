import { LogEngine } from "./engine.ts";
import { TracingContext } from "./context.ts";
import { levels, LogLevel } from "./level.ts";
import { LogLabels, makeRecord } from "./record.ts";

export class Logger {
  backend: LogEngine;
  readonly context?: string;
  readonly name?: string;

  constructor(backend?: LogEngine, labels?: LogLabels) {
    this.backend = backend ?? LogEngine.instance();
    this.context = labels?.context;
    this.name = labels?.name;
  }

  named(name: string) {
    return new Logger(this.backend, { name, context: this.context });
  }

  /**
   * Return a new logger derived from this logger with the specified name.
   * @param ctx The tracing context.
   * @returns A logger tracing this logger.
   */
  tagged(ctx?: TracingContext) {
    return new Logger(this.backend, { name: this.name, context: ctx?.tag });
  }

  _log(level: LogLevel, msg: string, args: unknown[]): void {
    if (!this.backend) return;
    if (!this.backend.wants(level, this.name)) return;
    let record = makeRecord(this, level, msg, args);
    this.backend.writeRecord(record);
  }

  xsilly(msg: string, ...args: unknown[]) {
    this._log(levels.xsilly, msg, args);
  }

  silly(msg: string, ...args: unknown[]) {
    this._log(levels.silly, msg, args);
  }

  verbose(msg: string, ...args: unknown[]) {
    this._log(levels.verbose, msg, args);
  }

  debug(msg: string, ...args: unknown[]) {
    this._log(levels.debug, msg, args);
  }

  info(msg: string, ...args: unknown[]) {
    this._log(levels.info, msg, args);
  }

  msg(msg: string, ...args: unknown[]) {
    this.info(msg, ...args);
  }

  warn(msg: string, ...args: unknown[]) {
    this.warning(msg, ...args);
  }

  warning(msg: string, ...args: unknown[]) {
    this._log(levels.warning, msg, args);
  }

  error(msg: string, ...args: unknown[]) {
    this._log(levels.error, msg, args);
  }

  critical(msg: string, ...args: unknown[]) {
    this._log(levels.critical, msg, args);
  }
}

const LOGGERS: Record<string, Logger> = {};
/**
 * The root logger.
 */
export const rootLogger = LOGGERS["##ROOT##"] = new Logger();

/**
 * Create a new named logger.
 * @param name The logger name.
 * @returns The logger.
 */
export function namedLogger(name: string): Logger {
  let logger = LOGGERS[name];
  if (!logger) {
    LOGGERS[name] = logger = rootLogger.named(name);
  }
  return logger;
}
