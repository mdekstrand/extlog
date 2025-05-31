import { EventEmitter } from "@mary/events";

export type GaugeEvents = {
  refresh: [];
  finish: [];
};

export abstract class Gauge extends EventEmitter<GaugeEvents> {
  /**
   * Render a gauge to a string.  The returned string should *not* include a newline.
   * @param size The terminal width.
   */
  abstract render(size: number): string;
}
