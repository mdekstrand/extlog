import { stripAnsiCode } from "@std/fmt/colors";
import { Closer, writeAllSync, WriterSync } from "@std/io";
import { parse as parsePath } from "@std/path/parse";

import { LZ4EncoderStream } from "@mdekstrand/streaming-lz4";
import { encodeUtf8 } from "../util/encoding.ts";
import type { LogWriter } from "./backend.ts";
import { levels, LogLevel, wantedAtOutputLevel } from "./level.ts";
import { formattedMessage, LogRecord } from "./record.ts";

export type LogFileEntry = {
  level: number;
  ts: string;
  name?: string;
  context?: string;
  message: string;
};

export function formatRecord(record: LogRecord): LogFileEntry {
  let level = record.level.number;
  if (level < levels.silly.number) {
    level = levels.silly.number;
  }
  let ts = record.timestamp.toISOString();

  let message = formattedMessage(record);
  message = stripAnsiCode(message);

  return {
    level: level,
    ts,
    name: record.labels?.name,
    context: record.labels?.context,
    message,
  };
}

export class FileLogWriter implements LogWriter {
  file: WriterSync & Closer;
  level: LogLevel;
  proc?: Deno.ChildProcess;

  constructor(file: WriterSync & Closer, level: LogLevel) {
    this.file = file;
    this.level = level;
  }

  static async open(path: string, level: LogLevel): Promise<FileLogWriter> {
    let parsed = parsePath(path);
    let writer;
    if (parsed.ext == ".lz4") {
      let file = await Deno.open(path, { write: true, create: true, truncate: true });
      let encoder = new LZ4EncoderStream(file);
      writer = new FileLogWriter(encoder, level);
    } else {
      let file = await Deno.open(path, { write: true, create: true, truncate: true });
      writer = new FileLogWriter(file, level);
    }

    return writer;
  }

  async close(): Promise<void> {
    this.file.close();
    if (this.proc) {
      let stat = await this.proc.status;
      if (stat.code != 0) {
        console.error("log compressor failed with code %d", stat.code);
      }
    }
  }

  writeRecord(record: LogRecord): void {
    if (!wantedAtOutputLevel(record.level, this.level)) return;
    let entry = formatRecord(record);
    writeAllSync(this.file, encodeUtf8(JSON.stringify(entry) + "\n"));
  }
}
