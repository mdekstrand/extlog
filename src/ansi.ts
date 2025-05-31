/**
 * Tiny ANSI terminal library, just meeting the needs of the console.
 * @module
 */

/**
 * ANSI Control Sequence Intoducer.
 */
export const CSI = "\x1b[";

export function cursorUp(n: number = 1): string {
  return `${CSI}${n.toFixed(0)}A`;
}

export function cursorDown(n: number = 1): string {
  return `${CSI}${n.toFixed(0)}B`;
}

export function eraseLine(): string {
  return `${CSI}0K`;
}
