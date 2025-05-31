import { LogLevel, wantedAtOutputLevel } from "./level.ts";
import { LogRecord } from "./record.ts";

/**
 * Interface for log writing backends.
 */
export interface LogWriter {
  /**
   * Log writer's level, for fast checking.
   */
  readonly level: LogLevel;

  /**
   * Write a log record to the backend.
   * @param record The log record.
   */
  writeRecord(record: LogRecord): void;

  close(): void | Promise<void>;
}

/**
 * Backend that actually writes logging events.
 */
export class LogBackend {
  writers: LogWriter[] = [];

  constructor() {
  }

  static instance(): LogBackend {
    return INSTANCE;
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
  async writeRecord(record: LogRecord): Promise<void> {
    await Promise.all(this.writers.map((w) => w.writeRecord(record)));
  }

  addWriter(w: LogWriter): void {
    this.writers.push(w);
  }

  async shutdown(): Promise<void> {
    await Promise.all(this.writers.map((w) => w.close()));
  }
}

const INSTANCE = new LogBackend();
