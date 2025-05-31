import { formatString } from "../util/format.ts";
import { LogLevel } from "./level.ts";

export type LogLabels = {
  process?: string;
  context?: string;
  name?: string;
};

export type LogRecord = {
  timestamp: Date;
  level: LogLevel;
  labels?: LogLabels;
  message: string;
  args: unknown[];
  formatted?: string;
};

export function makeRecord(
  labels: LogLabels,
  level: LogLevel,
  message: string,
  args: unknown[],
): LogRecord {
  return {
    timestamp: new Date(),
    level,
    labels,
    message,
    args,
  };
}

export function formattedMessage(log: LogRecord): string {
  if (!log.args.length) return log.message;

  if (!log.formatted) {
    try {
      log.formatted = formatString(log.message, ...log.args);
    } catch (e) {
      if (e instanceof TypeError) {
        console.error("LOG ERROR: %s", e);
        throw new TypeError("format / type mismatch");
      } else {
        throw e;
      }
    }
  }
  return log.formatted;
}
