import { LogLevel, wantedAtOutputLevel } from "./level.ts";
import { LogRecord } from "./record.ts";
import { LogWriter } from "./writer.ts";

let ACTIVE_INSTANCE: LogEngine | null = null;

/**
 * Logging engine that handles and writes logging events.
 *
 * Client code should not instantiate logging engines; rather, they
 * should be set up with {@link setupLogging}.  Log engines are disposable,
 * and disposing them will shut down the logging sytem.
 */
export class LogEngine {
  writers: LogWriter[] = [];

  /**
   * Construct a logging engine.  **Client code should not construct logging
   * engines.**
   */
  constructor() {
  }

  /**
   * Get the logging engine instance.
   */
  static activeInstance(): LogEngine | null {
    return ACTIVE_INSTANCE;
  }

  /**
   * Install this engine as the active log engine.
   *
   * Client code should not call this method — use {@link setupLogging}.
   */
  installAsActive(): void {
    if (ACTIVE_INSTANCE) {
      throw new Error("a logging instance is already active");
    }
    ACTIVE_INSTANCE = this;
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
    ACTIVE_INSTANCE = null;
  }

  [Symbol.dispose]() {
    this.shutdown();
  }
}
