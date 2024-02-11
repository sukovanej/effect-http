import * as fs from "node:fs"

import { Data, Effect, Layer, Logger, LogLevel, pipe } from "effect"
import { PrettyLogger } from "effect-log"

export class FileNotFoundError extends Data.TaggedError("FileNotFoundError")<{
  filename: string
}> {}

export const readFile = (filename: string) =>
  Effect.async<string, FileNotFoundError>((cb) =>
    fs.readFile(filename, { encoding: "utf8" }, (error, content) => {
      if (error !== null) {
        cb(Effect.fail(new FileNotFoundError({ filename })))
      } else {
        cb(Effect.succeed(content))
      }
    })
  )

export const debugLogger = pipe(
  PrettyLogger.layer(),
  Layer.merge(Logger.minimumLogLevel(LogLevel.All))
)
