import { TracingContext } from "./context.ts";

export class PerfMark {
  name: string;
  detail?: unknown;

  constructor(name: string, detail?: unknown) {
    this.name = name;
    this.detail = detail;
  }

  measure(detail?: unknown) {
    performance.measure(this.name, {
      start: `start:${this.name}`,
      detail: detail ?? this.detail,
    });
  }
}

export function timingMark(name: string, detail?: Record<string, unknown>) {
  performance.mark(`start:${name}`);
  if (detail?.context && detail.context instanceof TracingContext) {
    detail.context = detail.context.tag;
  }
  return new PerfMark(name, detail);
}
