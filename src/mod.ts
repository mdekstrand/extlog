import { LogWriter } from "./backend.ts";
import { addGauge, removeGauge } from "./console.ts";
import { newContext, TracingContext } from "./context.ts";
import { type Logger, namedLogger, rootLogger } from "./logger.ts";
import { timingMark } from "./perf.ts";
import { type ProgressBar, progressBar } from "./progress.ts";
import { setupLogging } from "./setup.ts";

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
export type { Logger, LogWriter, ProgressBar };

export default rootLogger;
