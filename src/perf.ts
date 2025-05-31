import { TracingContext } from "./context.ts";

/**
 * A performance marker for managing performance measurement lifecycles.
 *
 * This simplifies use of the JavaScript `performance` tools.  When the mark
 * is created (with {@link timingMark}), a start marker is created.  When
 * the {@link measure} method is called or the mark is disposed, timing
 * since the mark's creation is recorded with `performance.measure`.
 */
export interface PerfMark extends Disposable {
  readonly name: string;

  /**
   * Take the measurement.
   * @param detail Measurement details (overrides details provided at mark creation).
   */
  measure(detail?: Record<string, unknown>): void;
}

class PerfMarkImpl implements PerfMark {
  name: string;
  detail?: unknown;
  measured: boolean = false;

  constructor(name: string, detail?: unknown) {
    this.name = name;
    this.detail = detail;
  }

  [Symbol.dispose]() {
    this.measure();
  }

  measure(detail?: unknown) {
    if (this.measured) return;

    performance.measure(this.name, {
      start: `start:${this.name}`,
      detail: detail ?? this.detail,
    });
    this.measured = true;
  }
}

/**
 * Create a mark for a future performance measurement.
 *
 * @param name The name of the performance mark.
 * @param detail Details to attach to the performance measuremnet.
 * @returns The mark object.
 */
export function timingMark(name: string, detail?: Record<string, unknown>): PerfMark {
  performance.mark(`start:${name}`);
  if (detail?.context && detail.context instanceof TracingContext) {
    detail.context = detail.context.tag;
  }
  return new PerfMarkImpl(name, detail);
}
