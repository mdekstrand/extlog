import { LogWriter } from "./writer.ts";
import { addGauge, removeGauge } from "./console.ts";
import { newContext, TracingContext } from "./context.ts";
import { type Logger, namedLogger, rootLogger } from "./logger.ts";
import { timingMark } from "./perf.ts";
import { type ProgressBar, progressBar } from "./progress.ts";
import { setupLogging } from "./setup.ts";
import type { LogEngine } from "./engine.ts";

export {
  addGauge,
  namedLogger,
  newContext,
  progressBar,
  removeGauge,
  rootLogger,
  setupLogging,
  timingMark,
  TracingContext,
};
export type { LogEngine, Logger, LogWriter, ProgressBar };

export default rootLogger;
