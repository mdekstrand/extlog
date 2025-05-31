/**
 * Process format strings.
 *
 * @module
 */
// deno-lint-ignore-file no-explicit-any
import { AssertionError } from "@std/assert/assertion-error";

type LiteralSegment = { literal: string };
type ValueSegment = { code: string };
type FormatSegment = LiteralSegment | ValueSegment;
type ParsedFormat = FormatSegment[];

const formatCache: Map<string, ParsedFormat> = new Map();

/**
 * Format a message mostly like `console.log`, with some extras like `sprintf`.
 *
 * It differs from `@std/fmt`'s `sprintf` in that `%s` calls `toString` (it is
 * identical to `%v`).
 *
 * @param format The format string.
 * @param values The values to interpolate.
 */
export function formatString(format: string, ...values: any[]): string {
  let segments = getParsedFormat(format);
  return renderFormat(segments, values);
}

function isLiteral(seg: any): seg is LiteralSegment {
  return seg.literal != undefined;
}
function isValue(seg: any): seg is ValueSegment {
  return seg.code != undefined;
}

function getParsedFormat(format: string): FormatSegment[] {
  let cached = formatCache.get(format);
  if (!cached) {
    cached = parseFormat(format);
    formatCache.set(format, cached);
  }
  return cached;
}

function parseFormat(format: string): FormatSegment[] {
  let segments: FormatSegment[] = [];

  let start = 0;
  let pos;
  while (start < format.length && (pos = format.indexOf("%", start)) >= 0) {
    let nextPos = pos + 1;
    if (nextPos == format.length) {
      throw new Error("% found at end of format string");
    }
    let next = format.charAt(nextPos);
    if (next == "%") {
      segments.push({ literal: format.slice(start, nextPos) });
      start = nextPos + 1;
      continue;
    } else if (pos > start) {
      segments.push({ literal: format.slice(start, pos) });
    }

    segments.push({ code: next });
    start = nextPos + 1;
  }

  if (start < format.length) {
    segments.push({ literal: format.slice(start) });
  }

  return segments;
}

function renderFormat(segments: FormatSegment[], values: any[]): string {
  let result = "";

  let vi = 0;
  for (let seg of segments) {
    if (isLiteral(seg)) {
      result += seg.literal;
    } else if (isValue(seg)) {
      let val = values[vi];
      switch (seg.code) {
        case "s":
        case "v":
          if (val === null) {
            result += "⟨null⟩";
          } else if (val === undefined) {
            result += "⟨undefined⟩";
          } else {
            result += val.toString();
          }
          break;
        case "i":
          result += Deno.inspect(val, {
            compact: true,
            colors: true,
          });
          break;
        case "I":
          result += Deno.inspect(val, {
            compact: false,
            colors: true,
          });
          break;
        case "d":
          result += Math.floor(val).toString();
          break;
        case "o":
          result += Math.floor(val).toString(8);
          break;
        case "x":
          result += Math.floor(val).toString(16);
          break;
        case "f":
          result += val.toString();
          break;
        default:
          throw new Error(`unknown code ${seg.code}`);
      }
      vi++;
    } else {
      throw new AssertionError("invalid segment type");
    }
  }

  return result;
}
