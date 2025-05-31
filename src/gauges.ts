/**
 * Interface for “gauges”, display lines at the bottom of the console display.
 */
import { EventEmitter } from "@mary/events";
export { addGauge, removeGauge } from "./console.ts";

/**
 * Events emitted by a gauge.
 */
export type GaugeEvents = {
  /**
   * The gauge has been updated and needs to be refreshed.
   */
  refresh: [];
  /**
   * The gauge is finished and can be removed from the display.
   */
  finish: [];
};

/**
 * Base class for gauges.  Gauges emit events to inform the console of their need to
 * redisplay, and the console renders them with the {@link render} method.
 */
export abstract class Gauge extends EventEmitter<GaugeEvents> {
  /**
   * Render a gauge to a string.  The returned string should *not* include a newline.
   * @param size The terminal width.
   */
  abstract render(size: number): string;
}
