import * as Log from "effect-log";
import fs from "fs";

import * as Data from "@effect/data/Data";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as Logger from "@effect/io/Logger";
import * as LogLevel from "@effect/io/Logger/Level";

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
  Layer.merge(Logger.minimumLogLevel(LogLevel.All)),
);
