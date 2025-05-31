import { assert } from "@std/assert/assert";
import * as colors from "@std/fmt/colors";
import { chainStyles } from "./style.ts";

export type LogLevel = {
  name: string;
  number: number;
  tag: string;
  style: (text: string) => string;
  msg_style: (text: string) => string;
};

const LEVEL_DEFS: Record<string, Partial<LogLevel>> = {
  xsilly: {
    number: 5,
    tag: "SIL",
    style: colors.gray,
  },
  silly: {
    number: 10,
    tag: "SIL",
    style: colors.gray,
  },
  verbose: {
    number: 30,
    tag: "VRB",
    style: colors.white,
  },
  debug: {
    number: 40,
    tag: "DBG",
    style: colors.green,
  },
  info: {
    number: 50,
    tag: "MSG",
    style: chainStyles(colors.bold, colors.blue),
  },
  warning: {
    number: 70,
    tag: "WRN",
    style: chainStyles(colors.bold, colors.yellow),
    msg_style: colors.yellow,
  },
  error: {
    number: 80,
    tag: "ERR",
    style: chainStyles(colors.bold, colors.red),
    msg_style: colors.red,
  },
  critical: {
    number: 100,
    tag: "CRI",
    style: chainStyles(colors.bold, colors.white, colors.bgRed),
    msg_style: chainStyles(colors.bold, colors.red),
  },
};

const { levels, sequence, infoOffset } = initializeLevels(LEVEL_DEFS);
export { levels };

function initializeLevels(spec: Record<string, Partial<LogLevel>>): {
  levels: Record<string, LogLevel>;
  sequence: LogLevel[];
  infoOffset: number;
} {
  let names = Object.keys(spec);
  let infoOffset = names.indexOf("info");
  assert(infoOffset >= 0);

  let levels: Record<string, LogLevel> = {};
  let sequence: LogLevel[] = [];

  let number = -infoOffset;
  for (let [name, lvl] of Object.entries(spec)) {
    levels[name] = Object.assign({
      name,
      number,
      tag: "UNK",
      style: (text: string) => text,
      msg_style: (text: string) => text,
    }, lvl);
    sequence.push(levels[name]);
    number += 1;
  }

  return { levels, sequence, infoOffset };
}

/**
 * Look up a level by number or name.
 */
export function levelForVerbosity(verbosity: number): LogLevel {
  let idx = infoOffset - verbosity;
  if (idx < 0) {
    idx = 0;
  }
  if (idx >= sequence.length) {
    idx = sequence.length - 1;
  }
  return sequence[idx];
}

/**
 * Check if a specified log level would be output at a specified output level.
 * @param level The log level to check.
 * @param output The output's log level.
 * @returns `true` if the specified log level would be output at the output level.
 */
export function wantedAtOutputLevel(level: LogLevel, output: LogLevel): boolean {
  return level.number >= output.number;
}
