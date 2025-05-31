/**
 * Helper functions for terminal and text styling.
 */
import * as colors from "@std/fmt/colors";

/**
 * List of standard terminal colors.
 */
const KNOWN_COLORS = {
  "black": colors.black,
  "red": colors.red,
  "green": colors.green,
  "yellow": colors.yellow,
  "blue": colors.blue,
  "magenta": colors.magenta,
  "cyan": colors.cyan,
  "white": colors.white,
};

/**
 * The name of one of the standard terminal colors.
 */
export type TermColorName = keyof typeof KNOWN_COLORS;

/**
 * Styles, represented as functions that apply the style codes to a string.
 */
export type Style = (s: string) => string;

/**
 * The no-style identity function.
 */
export function noStyle(s: string): string {
  return s;
}

export function chainStyles(...styles: Style[]): Style {
  if (styles.length == 0) {
    return noStyle;
  }

  let [outer, ...inner] = styles;

  if (inner.length) {
    let chain = chainStyles(...inner);
    return (s) => outer(chain(s));
  } else {
    return outer;
  }
}

/**
 * Look up a color style by name.
 * @param color The color name.
 * @returns The color's style function.
 */
export function colorByName(color: TermColorName): Style {
  return KNOWN_COLORS[color] ?? colors.white;
}

export function pad(str: string, width: number): string {
  let needed = width - str.length;
  if (needed > 0) {
    return " ".repeat(needed) + str;
  } else {
    return str;
  }
}
