import fs from "fs";

import { Data, Effect, Layer, Logger, LoggerLevel, pipe } from "effect";
import * as Log from "effect-log";

export interface FileNotFoundError extends Data.Case {
  readonly _tag: "FileNotFoundError";
  readonly filename: string;
}

export const FileNotFoundError =
  Data.tagged<FileNotFoundError>("FileNotFoundError");

export const readFile = (filename: string) =>
  Effect.async<never, FileNotFoundError, string>((cb) =>
    fs.readFile(filename, { encoding: "utf8" }, (error, content) => {
      if (error !== null) {
        cb(Effect.fail(FileNotFoundError({ filename })));
      } else {
        cb(Effect.succeed(content));
      }
    }),
  );

export const setDebugLogger = pipe(
  Logger.replace(Logger.defaultLogger, Log.pretty),
  Layer.merge(Logger.minimumLogLevel(LoggerLevel.All)),
);
