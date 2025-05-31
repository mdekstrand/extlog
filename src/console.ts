import * as colors from "@std/fmt/colors";
import { writeAllSync, WriterSync } from "@std/io";

import { TextAccum } from "./text-accum.ts";

import type { LogWriter } from "./writer.ts";
import { Gauge } from "./gauge.ts";
import { levels, LogLevel, wantedAtOutputLevel } from "./level.ts";
import { namedLogger } from "./logger.ts";
import { formattedMessage, LogRecord } from "./record.ts";
import { elapsedMillis, formatDuration } from "./time.ts";
import { cursorPosition, eraseScreen, resetScroll, scrollRegion } from "./ansi.ts";
import { pad } from "./style.ts";

const log = namedLogger("console");

let ACTIVE_CONSOLE: ConsoleDisplay | null = null;
const UTF8 = new TextEncoder();

type ConsoleOutput = WriterSync & { isTerminal(): boolean };

/**
 * Class to manage console displays with progress bars, meters, etc.
 */
export class ConsoleDisplay {
  #stream: WriterSync;
  #gauges: Gauge[] = [];
  readonly active: boolean;
  #timer?: number;

  constructor(stream: ConsoleOutput, active: boolean = true) {
    this.#stream = stream;
    this.active = active;
    ACTIVE_CONSOLE = this;
  }

  static forStream(stream: ConsoleOutput): ConsoleDisplay {
    return new ConsoleDisplay(stream, stream.isTerminal());
  }

  static active(): ConsoleDisplay | null {
    return ACTIVE_CONSOLE;
  }

  [Symbol.dispose]() {
    this.shutdown();
  }

  shutdown(): void {
    let size = Deno.consoleSize();
    let n = this.#clearGauges();
    this.write(resetScroll());
    this.write(cursorPosition(size.rows - n));
  }

  addGauge(gauge: Gauge): void {
    this.#clearGauges();
    this.write("\n");
    this.#gauges.push(gauge);
    gauge.on("refresh", this.gaugeWantsRefresh.bind(this, gauge));
    gauge.on("finish", this.gaugeFinished.bind(this, gauge));
    log.verbose("adding gauge (%d total)", this.#gauges.length);
    this.#renderGauges();
  }

  removeGauge(gauge: Gauge): void {
    let oldN = this.#clearGauges();
    let n = this.#gauges.indexOf(gauge);
    if (n >= 0) {
      log.verbose("removing gage %d (%d total)", n, this.#gauges.length);
      this.#gauges.splice(n, 1);
    }
    this.#renderGauges(oldN);
  }

  /**
   * Render the gauges.
   */
  #renderGauges(oldN?: number) {
    if (!this.active || !this.#gauges.length) {
      return;
    }

    let size = Deno.consoleSize();
    this.write(eraseScreen());

    let n = this.#gauges.length;

    for (let i = 0; i < n; i++) {
      let gauge = this.#gauges[i];
      this.write(cursorPosition(size.rows - i));
      this.write(gauge.render(size.columns));
    }

    this.write(scrollRegion(1, size.rows - n));
    this.write(cursorPosition(size.rows - (oldN ?? n)));
  }

  /**
   * Clear the gauges from the screen.
   */
  #clearGauges(): number {
    if (!this.active || !this.#gauges.length) {
      return 0;
    }

    this.write(eraseScreen());
    return this.#gauges.length;
  }

  refresh(option?: "oneshot" | "timer"): void {
    if (option == "timer" || this.#timer == null) {
      if (this.#gauges.length) {
        this.#renderGauges();
        if (option != "oneshot") {
          this.#timer = setTimeout(this.refresh.bind(this, "timer"), 40);
        }
      } else {
        this.#timer = undefined;
      }
    }
  }

  private gaugeWantsRefresh(_gauge: Gauge): void {
    this.refresh();
  }

  private gaugeFinished(gauge: Gauge): void {
    this.removeGauge(gauge);
  }

  private write(data: string | Uint8Array) {
    if (typeof data == "string") {
      data = UTF8.encode(data);
    }
    writeAllSync(this.#stream, data);
  }
}

/**
 * Log writer that writes the console manager.
 */
export class ConsoleLogWriter implements LogWriter {
  #output: ConsoleOutput;
  level: LogLevel;
  start: Date;
  globalStart?: Date;
  colorEnabled = !Deno.noColor;

  constructor(level: LogLevel, output?: ConsoleOutput) {
    this.level = level;
    this.start = new Date();
    this.#output = output ?? Deno.stderr;
    this.colorEnabled &&= this.#output.isTerminal();
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
    accum.add("\n");
    let text = accum.text;

    writeAllSync(this.#output, UTF8.encode(text));
  }

  close(): void {
  }
}

/**
 * Activate a logging console to enable gauges and other outputs, if supported.
 */
export function setupConsole(): ConsoleDisplay | null {
  if (ACTIVE_CONSOLE) {
    throw new Error("logging console already active");
  }
  if (Deno.stderr.isTerminal()) {
    ACTIVE_CONSOLE = new ConsoleDisplay(Deno.stderr);
    return ACTIVE_CONSOLE;
  } else {
    return null;
  }
}

export function addGauge(gauge: Gauge): void {
  let console = ConsoleDisplay.active();
  if (console) {
    console.addGauge(gauge);
  }
}
export function removeGauge(gauge: Gauge): void {
  let console = ConsoleDisplay.active();
  if (console) {
    console.removeGauge(gauge);
  }
}
