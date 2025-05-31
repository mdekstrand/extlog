import type { LogLevel } from "./level.ts";
import type { LogRecord } from "./record.ts";

/**
 * Interface for log writing backends.
 *
 * Log writing backends are **synchronous**.  It is perfectly acceptable
 * for them to enqueue the message for later writing.
 */
export interface LogWriter {
  /**
   * Log writer's level, for fast checking.
   */
  readonly level: LogLevel;

  /**
   * Write a log record to the backend.
   *
   * @param record The log record.
   */
  writeRecord(record: LogRecord): void;

  close(): void | Promise<void>;
}
