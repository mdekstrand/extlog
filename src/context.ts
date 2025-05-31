import { crypto } from "@std/crypto";
import { encodeBase32 } from "@std/encoding";

const UTF8 = new TextEncoder();

/**
 * Create a new tracing context.
 *
 * Tracing contexts support tracing a single action across multiple loggers and
 * modules.
 *
 * @returns The context.
 */
export function newContext(key?: string): TracingContext {
  let bytes;
  if (key) {
    let kb = UTF8.encode(key);
    bytes = crypto.subtle.digestSync("FNV64A", kb);
  } else {
    bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
  }
  let tag = encodeBase32(bytes).slice(0, 12);
  return new TracingContext(tag);
}

/**
 * Context for tracing operations in the logger.
 */
export class TracingContext {
  readonly tag: string;

  constructor(tag: string) {
    this.tag = tag;
  }

  toString(): string {
    return this.tag;
  }

  [Symbol.for("Deno.customInspect")](): string {
    return `#${this.tag}`;
  }
}
