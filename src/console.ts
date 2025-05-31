import { stripAnsiCode } from "@std/fmt/colors";
import { sprintf } from "@std/fmt/printf";
import { writeAllSync, WriterSync } from "@std/io";

import { ansi, AnsiChain } from "@cliffy/ansi";
import { colors } from "@cliffy/ansi/colors";
import { differenceInMilliseconds } from "date-fns/differenceInMilliseconds";

import { encodeUtf8 } from "../util/encoding.ts";
import { TextAccum } from "../util/text-accum.ts";

import type { LogWriter } from "./backend.ts";
import { Gauge } from "./gauge.ts";
import { levels, LogLevel, wantedAtOutputLevel } from "./level.ts";
import { namedLogger } from "./logger.ts";
import { formattedMessage, LogRecord } from "./record.ts";

const log = namedLogger("console");

/**
 * Class that manages console displays with progress bars, meters, etc.
 *
 * This class maintains the invariant that the cursor is positioned at the
 * beginning of the blank line above gauges.
 */
export class ConsoleLogView {
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
    this.write(ansi.cursorUp(this.gauges.length));
  }

  /**
   * Clear the gauges from the screen.
   */
  clearGauges() {
    if (!this.active || !this.gauges.length) {
      return;
    }

    for (let i = 0; i < this.gauges.length; i++) {
      let cmd = ansi.cursorDown.eraseLine;
      this.write(cmd);
    }
    this.write(ansi.cursorUp(this.gauges.length));
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

  gaugeWantsRefresh(_gauge: Gauge): void {
    this.refresh();
  }

  gaugeFinished(gauge: Gauge): void {
    this.removeGauge(gauge);
  }

  /**
   * Write text to the console.
   */
  writeText(text: string) {
    this.clearGauges();
    if (!this.colorEnabled) {
      text = stripAnsiCode(text);
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

  private write(data: string | Uint8Array | AnsiChain) {
    if (typeof data == "string") {
      data = encodeUtf8(data);
    } else if (!ArrayBuffer.isView(data)) {
      data = data.bytes();
    }
    writeAllSync(this.stream, data);
  }
}

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
    let ldstr = formatDuration(differenceInMilliseconds(record.timestamp, this.start));
    if (this.globalStart) {
      let gdstr = formatDuration(differenceInMilliseconds(record.timestamp, this.globalStart), 7);
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

function formatDuration(ms: number, width = 6) {
  let seconds = ms / 1000;
  let rfmt;
  if (seconds > 60) {
    rfmt = sprintf("%dm%.1fs", Math.floor(seconds / 60), seconds % 60);
  } else {
    rfmt = sprintf("%.2fs", seconds);
  }

  if (rfmt.length < width) {
    rfmt = " ".repeat(width - rfmt.length) + rfmt;
  }

  return rfmt;
}

export const CONSOLE_STDERR: ConsoleLogView = ConsoleLogView.forStream(Deno.stderr);

export function addGauge(gauge: Gauge): void {
  CONSOLE_STDERR.addGauge(gauge);
}
export function removeGauge(gauge: Gauge): void {
  CONSOLE_STDERR.removeGauge(gauge);
}
