/**
 * Utility code to render meters (progress bars, etc.).
 *
 * @module
 */

import { Style } from "./style.ts";

const FULL_BLOCK = "\u2588";

type Segment = {
  size: number;
  style?: Style;
};
type RenderSegment = Segment & { fraction: number };

/**
 * Render "meter bars" consisting of multiple styled segments.
 */
export class MeterBar {
  width: number;
  segments: Segment[] = [];
  total: number = 0;

  constructor(width: number) {
    this.width = width;
  }

  addSegment(size: number, style?: Style) {
    this.segments.push({ size, style });
    this.total += size;
  }

  addRemaining(total: number, style?: Style) {
    if (total < this.total) {
      throw new Error(`'new total ${total} is less than accumulated total ${this.total}`);
    }

    this.segments.push({
      size: total - this.total,
      style,
    });
    this.total = total;
  }

  render(): string {
    let segments: RenderSegment[] = this.segments.map((s) =>
      Object.assign({}, s, { fraction: s.size / this.total })
    );

    let remaining = this.width;
    let bar = "";
    for (let s of segments) {
      let n = Math.round(s.fraction * this.width);
      if (remaining < n) {
        n = remaining;
      }
      if (n == 0) continue;

      let chars = FULL_BLOCK.repeat(n);
      remaining -= n;
      if (s.style) {
        chars = s.style(chars);
      }
      bar += chars;
    }

    return bar;
  }
}
