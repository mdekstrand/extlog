import { LogLevel, wantedAtOutputLevel } from "./level.ts";
import { LogRecord } from "./record.ts";
import { LogWriter } from "./writer.ts";

/**
 * Get the log engine.
 * @returns The log engine.
 */
export function logEngine(): LogEngine {
  return INSTANCE;
}

/**
 * Get the log engine as its actual implementation for internal use.
 */
export function logEngineInternal(): LogEngineImpl {
  return INSTANCE;
}

/**
 * Public interface for the engine that drives and manages logging.
 */
export interface LogEngine extends Disposable {
  /**
   * Check if any backend wants this log message.
   * @param level The level.
   */
  wants(level: LogLevel, _name: string | undefined): boolean;

  /**
   * Write the record to the log output.
   */
  writeRecord(record: LogRecord): void;

  /**
   * Shut down the logging engine.
   *
   * This tears down the writers, closes output files, restores the terminal to
   * its original state, etc.
   */
  shutdown(): void;
}

export class LogEngineImpl implements LogEngine {
  writers: LogWriter[] = [];

  /**
   * Construct a logging engine.  **Client code should not construct logging
   * engines.**
   */
  constructor() {
  }

  /**
   * Check if any backend wants this log message.
   * @param level The level.
   */
  wants(level: LogLevel, _name: string | undefined): boolean {
    for (let w of this.writers) {
      if (wantedAtOutputLevel(level, w.level)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Write the record to the log output.
   */
  writeRecord(record: LogRecord): void {
    for (let w of this.writers) {
      w.writeRecord(record);
    }
  }

  /**
   * Add a log writer to this engine.
   *
   * @param w The writer to add.
   */
  addWriter(w: LogWriter): void {
    this.writers.push(w);
  }

  /**
   * Shut down the logging engine.
   */
  shutdown(): void {
    for (let writer of this.writers) {
      writer.close();
    }
  }

  [Symbol.dispose]() {
    this.shutdown();
  }
}

let INSTANCE: LogEngineImpl = new LogEngineImpl();
