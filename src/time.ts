/**
 * Time and date utilities used in the logging implementation.
 * @module
 */

import { sprintf } from "@std/fmt/printf";

/**
 * The time elapsed between a current time and a start time.
 *
 * @param now The current time.
 * @param start The origin time.
 * @returns The number of milliseconds from start to now.
 */
export function elapsedMillis(now: Date, start: Date): number {
  return now.valueOf() - start.valueOf();
}

/**
 * Compactly format a duration.
 * @param ms The duration, in milliseconds.
 * @returns
 */
export function formatDuration(ms: number) {
  let seconds = ms / 1000;
  if (seconds > 60) {
    return sprintf("%dm%0.1fs", Math.floor(seconds / 60), seconds % 60);
  } else {
    return sprintf("%0.2fs", seconds);
  }
}
