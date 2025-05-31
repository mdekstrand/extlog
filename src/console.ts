import * as colors from "@std/fmt/colors";
import { writeAllSync, WriterSync } from "@std/io";

import { TextAccum } from "./text-accum.ts";

import type { LogWriter } from "./writer.ts";
import { Gauge } from "./gauge.ts";
import { levels, LogLevel, wantedAtOutputLevel } from "./level.ts";
import { namedLogger } from "./logger.ts";
import { formattedMessage, LogRecord } from "./record.ts";
import { elapsedMillis, formatDuration } from "./time.ts";
import { cursorDown, cursorUp, eraseLine } from "./ansi.ts";
import { pad } from "./style.ts";

const log = namedLogger("console");

/**
 * Class that manages console displays with progress bars, meters, etc.
 *
 * This class maintains the invariant that the cursor is positioned at the
 * beginning of the blank line above gauges.
 */
export class ConsoleLogView {
  private encoder: TextEncoder = new TextEncoder();
  stream: WriterSync;
  gauges: Gauge[] = [];
  active: boolean;
  colorEnabled = !Deno.noColor;
  timer?: number;

  constructor(stream: WriterSync & { isTerminal(): boolean }, active: boolean = true) {
    this.stream = stream;
    this.active = active;
    this.colorEnabled &&= stream.isTerminal();
  }

  static forStream(stream: WriterSync & { isTerminal(): boolean }): ConsoleLogView {
    return new ConsoleLogView(stream, stream.isTerminal());
  }

  addGauge(gauge: Gauge): void {
    this.clearGauges();
    this.gauges.push(gauge);
    gauge.on("refresh", this.gaugeWantsRefresh.bind(this, gauge));
    gauge.on("finish", this.gaugeFinished.bind(this, gauge));
    log.verbose("adding gauge (%d total)", this.gauges.length);
    this.renderGauges();
  }

  removeGauge(gauge: Gauge): void {
    this.clearGauges();
    let n = this.gauges.indexOf(gauge);
    if (n >= 0) {
      log.verbose("removing gage %d (%d total)", n, this.gauges.length);
      this.gauges.splice(n, 1);
    }
    this.renderGauges();
  }

  /**
   * Render the gauges.
   */
  renderGauges() {
    if (!this.active || !this.gauges.length) {
      return;
    }

    let size = Deno.consoleSize();
    for (let gauge of this.gauges) {
      let command = "\n";
      command += gauge.render(size.columns);
      command += "\r";
      this.write(command);
    }
    this.write(cursorUp(this.gauges.length));
  }

  /**
   * Clear the gauges from the screen.
   */
  clearGauges() {
    if (!this.active || !this.gauges.length) {
      return;
    }

    for (let i = 0; i < this.gauges.length; i++) {
      let cmd = cursorDown() + eraseLine();
      this.write(cmd);
    }
    this.write(cursorUp(this.gauges.length));
  }

  refresh(option?: "oneshot" | "timer"): void {
    if (option == "timer" || this.timer == null) {
      if (this.gauges.length) {
        this.renderGauges();
        if (option != "oneshot") {
          this.timer = setTimeout(this.refresh.bind(this, "timer"), 40);
        }
      } else {
        delete this.timer;
      }
    }
  }

  private gaugeWantsRefresh(_gauge: Gauge): void {
    this.refresh();
  }

  private gaugeFinished(gauge: Gauge): void {
    this.removeGauge(gauge);
  }

  /**
   * Write text to the console.
   */
  writeText(text: string) {
    this.clearGauges();
    if (!this.colorEnabled) {
      text = colors.stripAnsiCode(text);
    }
    this.write(text);
    if (!text.endsWith("\n")) {
      this.write("\n");
    }
    this.renderGauges();
  }

  /**
   * Construct a log writer.
   */
  logWriter(level: LogLevel): ConsoleLogWriter {
    return new ConsoleLogWriter(this, level);
  }

  /**
   * Get a writable stream that properly logs to the console.
   */
  get writable(): WritableStream<string> {
    // create a fresh stream ever time, because we don't actually want locking
    return new WritableStream({
      write: async (chunk, _controller) => {
        await this.writeText(chunk);
      },
    });
  }

  private write(data: string | Uint8Array) {
    if (typeof data == "string") {
      data = this.encoder.encode(data);
    }
    writeAllSync(this.stream, data);
  }
}

/**
 * Log writer that writes the console manager.
 */
export class ConsoleLogWriter implements LogWriter {
  console: ConsoleLogView;
  level: LogLevel;
  start: Date;
  globalStart?: Date;

  constructor(console: ConsoleLogView, level: LogLevel) {
    this.console = console;
    this.level = level;
    this.start = new Date();
  }

  writeRecord(record: LogRecord): void {
    let level = record.level;
    if (!wantedAtOutputLevel(level, this.level)) return;
    let accum = new TextAccum();
    let ldstr = pad(formatDuration(elapsedMillis(record.timestamp, this.start)), 6);
    if (this.globalStart) {
      let gdstr = pad(formatDuration(elapsedMillis(record.timestamp, this.globalStart)), 7);
      accum.add(`[${colors.blue(gdstr)} / ${colors.green(ldstr)}]`);
    } else {
      accum.add(`[${colors.green(ldstr)}]`);
    }
    if (record.labels?.process) {
      accum.add(colors.yellow(record.labels?.process));
    }
    accum.add(level.style(level.tag));

    let lmark = accum.mark();
    if (record.labels?.context && this.level.number < levels.info.number) {
      accum.add(colors.cyan(record.labels.context));
    }
    if (record.labels?.name) {
      accum.add(colors.magenta(record.labels.name));
    }
    accum.add(":", { pad: false, ifAddedSince: lmark });

    let msg = formattedMessage(record);
    msg = level.msg_style(msg);
    accum.add(msg);
    let text = accum.text;
    this.console.writeText(text + "\n");
  }

  close(): void {
  }
}

export const CONSOLE_STDERR: ConsoleLogView = ConsoleLogView.forStream(Deno.stderr);

export function addGauge(gauge: Gauge): void {
  CONSOLE_STDERR.addGauge(gauge);
}
export function removeGauge(gauge: Gauge): void {
  CONSOLE_STDERR.removeGauge(gauge);
}
