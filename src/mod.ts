import { addGauge, removeGauge } from "./console.ts";
import { newContext, TracingContext } from "./context.ts";
import { Logger, namedLogger, rootLogger } from "./logger.ts";
import { timingMark } from "./perf.ts";
import { progressBar } from "./progress.ts";
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
export type { Logger };

export default rootLogger;
/**
 * The root logger.
 * @deprecated Import without `*` or use {@link rootLogger} instead.
 */
export const log = rootLogger;
