import { crypto } from "@std/crypto";
import { encodeBase32 } from "@std/encoding";
import { encodeUtf8 } from "../util/encoding.ts";

/**
 * Create a new tracing context.
 * @returns The context.
 */
export function newContext(key?: string): TracingContext {
  let bytes;
  if (key) {
    let kb = encodeUtf8(key);
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
