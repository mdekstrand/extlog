/**
 * Progress bars.
 *
 * @module
 */
import { gray, stripAnsiCode, white } from "@std/fmt/colors";

import { addGauge } from "./console.ts";
import { Gauge } from "./gauge.ts";
import { rootLogger } from "./logger.ts";
import { MeterBar } from "./meter.ts";
import { colorByName, type Style, type TermColorName } from "./style.ts";

export type ProgressOptions = {
  label: string;
  total?: number;
  color?: TermColorName | Style;
};

/**
 * Progress bar to report progress in the output.
 */
export class ProgressBar extends Gauge {
  label: string;
  total: number;
  color: (s: string) => string;
  completed: number = 0;

  constructor(opts: ProgressOptions) {
    super();
    this.label = opts.label;
    this.total = opts.total ?? 0;
    if (typeof opts.color == "function") {
      this.color = opts.color;
    } else if (typeof opts.color == "string") {
      this.color = colorByName(opts.color);
    } else {
      this.color = white;
    }
  }

  updateTotal(n: number = 1) {
    this.total += n;
    this.emit("refresh");
  }

  update(n: number = 1) {
    if (this.completed < 0) return;

    this.completed += n;
    if (this.completed < 0) {
      rootLogger.warn(
        "%s: negative update made completed negative, clamping to 0",
        this.label,
      );
      this.completed = 0;
    }
    this.emit("refresh");
  }

  finish() {
    if (this.completed >= 0) {
      this.completed = -1;
      this.emit("finish");
    }
  }

  [Symbol.dispose]() {
    this.finish();
  }

  render(size: number): string {
    let pfx = this.label + ": ";
    let pfxLen = stripAnsiCode(pfx).length;

    let bar = new MeterBar(size - pfxLen);
    bar.addSegment(this.completed, this.color);
    bar.addRemaining(this.total, gray);

    return pfx + bar.render();
  }
}

export function progressBar(opts: ProgressOptions) {
  let bar = new ProgressBar(opts);
  addGauge(bar);
  return bar;
}
