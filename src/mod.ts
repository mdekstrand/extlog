/**
 * Flexible Deno logging library.
 *
 * This is a logging library, modeled somewhat after Winston, that provides
 * support for a wide range of logging levels including extended tracing levels.
 * It also supports “trace contexts” for attaching context identifiers to log
 * messages across modules, and has support for both JSON and rich console
 * output.  Output log files can also be automatically compressed with LZ4.
 *
 * Logging levels supported:
 *
 * 1. CRITICAL
 * 2. ERROR
 * 3. WARNING
 * 4. INFO, the default log level
 * 5. DEBUG
 * 6. VERBOSE
 * 7. SILLY
 * 8. XSILLY (extra silly)
 *
 * @module
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
