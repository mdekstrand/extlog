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

export function cursorPosition(row: number, col: number = 1): string {
  return `${CSI}${row.toFixed(0)};${col.toFixed(0)}H`;
}

export function eraseLine(): string {
  return `${CSI}0K`;
}

export function eraseScreen(code: 0 | 1 | 2 | 3 = 0): string {
  return `${CSI}${code.toFixed(0)}J`;
}

export function savePosition(): string {
  return `${CSI}7`;
}

export function restorePosition(): string {
  return `${CSI}8`;
}

export function scrollRegion(top: number, bottom: number): string {
  return `${CSI}${top.toFixed(0)};${bottom.toFixed(0)}r`;
}

export function resetScroll(): string {
  return `${CSI};r`;
}
