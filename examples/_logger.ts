import * as HashMap from "@effect/data/HashMap";
import { threadName } from "@effect/io/Fiber/Id";
import * as Logger from "@effect/io/Logger";
import { LogLevel } from "@effect/io/Logger/Level";

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const WHITE = "\x1b[37m";

const SEVERITY_TO_COLOR: Record<LogLevel["_tag"], string> = {
  All: WHITE,
  None: WHITE,
  Info: GREEN,
  Debug: BLUE,
  Error: RED,
  Fatal: BOLD + RED,
  Trace: DIM + WHITE,
  Warning: YELLOW,
};

export const prettyLogger = Logger.make(
  (fiberId, logLevel, message, _cause, _context, _spans, annotations) => {
    const logLevelColor = SEVERITY_TO_COLOR[logLevel._tag];
    const logLevelText = logLevel.label.padEnd(7, " ");
    const logLevelStr = `${logLevelColor}${logLevelText}${RESET}`;

    const now = new Date();
    const hoursText = now.getHours().toString().padStart(2, "0");
    const minutesText = now.getMinutes().toString().padStart(2, "0");
    const secondsText = now.getSeconds().toString().padStart(2, "0");
    const timeText = `${YELLOW}${hoursText}:${minutesText}:${secondsText}${RESET}`;

    const thread = threadName(fiberId);
    const fiberText = `${DIM}(Fiber ${thread})${RESET}`;

    console.log(`${timeText} ${fiberText} ${logLevelStr} ${message}`);

    if (!HashMap.isEmpty(annotations)) {
      const text = HashMap.reduceWithIndex(
        annotations,
        [] as string[],
        (acc, v, k) => [...acc, `${k}: ${v}`],
      );
      console.log(`${DIM}{ ${text.join(", ")} }${RESET}`);
    }
  },
);
