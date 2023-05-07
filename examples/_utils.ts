import fs from "fs";

import * as Data from "@effect/data/Data";
import * as Effect from "@effect/io/Effect";

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
