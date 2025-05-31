import { LogEngine, logEngineInternal } from "./engine.ts";
import { TracingContext } from "./context.ts";
import { levels, LogLevel } from "./level.ts";
import { LogLabels, makeRecord } from "./record.ts";

/**
 * Main interface for logging messages.
 *
 * Methods are provided for the different log levels.  Log methods accept format
 * strings like those accepted by `console.log` and friends, including support
 * for the `%i` and `%I` format specifiers.
 */
export class Logger {
  #engine: LogEngine;
  readonly context?: string;
  readonly name?: string;

  /**
   * Construct a new logger.
   *
   * Most code should not create `Logger` instances directly — instead, use
   * {@link rootLogger}, {@link namedLogger}, etc.
   *
   * @param engine The log engine.
   * @param labels Labels to attach to this logger.
   */
  constructor(engine?: LogEngine, labels?: LogLabels) {
    this.#engine = engine ?? logEngineInternal();
    this.context = labels?.context;
    this.name = labels?.name;
  }

  /**
   * Create a new logger defined from this logger with the specified name.
   *
   * @param name The logger name.
   * @returns A logger with the specified name.
   */
  named(name: string): Logger {
    return new Logger(this.#engine, { name, context: this.context });
  }

  /**
   * Return a new logger derived from this logger with the specified context.
   * @param ctx The tracing context.
   * @returns A logger with the specified tracing context.
   */
  tagged(ctx?: TracingContext): Logger {
    return new Logger(this.#engine, { name: this.name, context: ctx?.tag });
  }

  /**
   * Create and write a log message.
   */
  private _log(level: LogLevel, msg: string, args: unknown[]): void {
    if (!this.#engine) return;
    if (!this.#engine.wants(level, this.name)) return;
    let record = makeRecord(this, level, msg, args);
    this.#engine.writeRecord(record);
  }

  /**
   * Log a tracing message at the extra-silly level.  These are reported as
   * `SIL`, but require an additional level of verbosity to activate.
   */
  xsilly(msg: string, ...args: unknown[]): void {
    this._log(levels.xsilly, msg, args);
  }

  /**
   * Log a tracing message at the silly (`SIL`) level.
   */
  silly(msg: string, ...args: unknown[]): void {
    this._log(levels.silly, msg, args);
  }

  /**
   * Log a tracing message at the verbose (`VRB`) level.
   */
  verbose(msg: string, ...args: unknown[]): void {
    this._log(levels.verbose, msg, args);
  }

  /**
   * Log a message at the debug level.
   */
  debug(msg: string, ...args: unknown[]): void {
    this._log(levels.debug, msg, args);
  }

  /**
   * Log a message at the info level.
   */
  info(msg: string, ...args: unknown[]): void {
    this._log(levels.info, msg, args);
  }

  /**
   * Log a message at the info level (alias).
   */
  msg(msg: string, ...args: unknown[]): void {
    this.info(msg, ...args);
  }

  /**
   * Log a message at the warning level (alias).
   */
  warn(msg: string, ...args: unknown[]): void {
    this.warning(msg, ...args);
  }

  /**
   * Log a mesage at the warning level.
   */
  warning(msg: string, ...args: unknown[]): void {
    this._log(levels.warning, msg, args);
  }

  /**
   * Log a message at the error level.
   */
  error(msg: string, ...args: unknown[]): void {
    this._log(levels.error, msg, args);
  }

  /**
   * Log a message at the critical level.
   */
  critical(msg: string, ...args: unknown[]): void {
    this._log(levels.critical, msg, args);
  }
}

const ROOT_SYMBOL = Symbol("extlog.root-logger");
const LOGGERS: Record<symbol | string, Logger> = {};
/**
 * The root logger.
 */
export const rootLogger: Logger = LOGGERS[ROOT_SYMBOL] = new Logger();

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
