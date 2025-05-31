/**
 * Flexible Deno logging library.
 */
import { LogWriter } from "./writer.ts";
import { setupConsole } from "./console.ts";
import { newContext, TracingContext } from "./context.ts";
import { type Logger, namedLogger, rootLogger } from "./logger.ts";
import { type ProgressBar, progressBar } from "./progress.ts";
import { type LogOptions, setupLogging } from "./setup.ts";
import { type LogEngine, logEngine } from "./engine.ts";

export {
  logEngine,
  namedLogger,
  newContext,
  progressBar,
  rootLogger,
  setupConsole,
  setupLogging,
  TracingContext,
};
export type { LogEngine, Logger, LogOptions, LogWriter, ProgressBar };

export default rootLogger;
