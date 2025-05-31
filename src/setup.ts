import { assert } from "@std/assert/assert";

import { LogEngine, logEngineInternal } from "./engine.ts";
import { CONSOLE_STDERR } from "./console.ts";
import { levelForVerbosity } from "./level.ts";
import { FileLogWriter } from "./logfile.ts";
import { rootLogger } from "./logger.ts";

export type LogOptions = {
  verbosity?: number;
  process?: string;
  logFile?: string;
  fileVerbosity?: number;
};

/**
 * Initialize the logging infrastructure.
 */
export async function setupLogging(options?: LogOptions): Promise<LogEngine> {
  if (!options) options = {};
  let verbosity = options.verbosity ?? 0;
  let engine = logEngineInternal();

  let console = CONSOLE_STDERR;
  let level = levelForVerbosity(verbosity);
  assert(level);
  let clog = console.logWriter(level);

  let fc = Deno.env.get("FORCE_COLOR");
  if (fc && Number.parseInt(fc) > 0) {
    console.colorEnabled = true;
  }

  let marker = Deno.env.get("ME_LOG_STARTMARKER");
  if (marker) {
    try {
      let stat = await Deno.stat(marker);
      clog.globalStart = stat.mtime ?? undefined;
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) {
        throw e;
      }
    }
  }

  engine.addWriter(clog);

  let lf = options.logFile;
  let lf_verbose = undefined;
  if (!lf) {
    lf = Deno.env.get("ME_LOG_FILE");
    lf_verbose = Deno.env.get("ME_LOG_FILE_VERBOSE");
    if (lf_verbose != null) {
      lf_verbose = Number.parseInt(lf_verbose);
    }
  }

  if (lf) {
    let flevel = level;
    if (options.fileVerbosity) {
      flevel = levelForVerbosity(options.fileVerbosity)!;
    } else if (lf_verbose != null) {
      flevel = levelForVerbosity(lf_verbose)!;
    }

    let file = await FileLogWriter.open(lf, flevel);
    engine.addWriter(file);
    rootLogger.info(`writing rootLogger output to ${lf}`);
  }

  rootLogger.debug(`logging initialized`);

  return engine;
}
