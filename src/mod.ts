/**
 * Flexible Deno logging library.
 */
import { LogWriter } from "./writer.ts";
import { addGauge, removeGauge, setupConsole } from "./console.ts";
import { newContext, TracingContext } from "./context.ts";
import { type Logger, namedLogger, rootLogger } from "./logger.ts";
import { timingMark } from "./perf.ts";
import { type ProgressBar, progressBar } from "./progress.ts";
import { type LogOptions, setupLogging } from "./setup.ts";
import { type LogEngine, logEngine } from "./engine.ts";

export {
  addGauge,
  logEngine,
  namedLogger,
  newContext,
  progressBar,
  removeGauge,
  rootLogger,
  setupConsole,
  setupLogging,
  timingMark,
  TracingContext,
};
export type { LogEngine, Logger, LogOptions, LogWriter, ProgressBar };

export default rootLogger;
