import * as Http from "effect-http";
import fs from "fs";

import * as Context from "@effect/data/Context";
import * as Data from "@effect/data/Data";
import * as Duration from "@effect/data/Duration";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Logger from "@effect/io/Logger";
import * as LogLevel from "@effect/io/Logger/Level";
import * as Request from "@effect/io/Request";
import * as RequestResolver from "@effect/io/RequestResolver";
import * as Schema from "@effect/schema/Schema";

interface NotFoundError extends Data.Case {
  readonly _tag: "NotFoundError";
}
const NotFoundError = Data.tagged<NotFoundError>("NotFoundError");

interface GetValue extends Request.Request<NotFoundError, string> {
  readonly _tag: "GetValue";
}
const GetValue = Request.tagged<GetValue>("GetValue");

const GetValueCache = Context.Tag<Request.Cache>();

const readFileString = (file: string) =>
  pipe(
    Effect.async<never, NotFoundError, string>((cb) =>
      fs.readFile(file, { encoding: "utf8" }, (error, content) => {
        if (error !== null) {
          cb(Effect.fail(NotFoundError()));
        } else {
          cb(Effect.succeed(content));
        }
      }),
    ),
    Effect.tap(() => Effect.logDebug(`Content read from ${file}`)),
  );

const GetValueResolver = RequestResolver.fromFunctionEffect((_: GetValue) =>
  readFileString("test-file"),
);

const api = pipe(
  Http.api(),
  Http.get("getValue", "/value", { response: Schema.string }),
);

const server = pipe(
  Http.server(api),
  Http.handle("getValue", () =>
    Effect.flatMap(GetValueCache, (getValueCache) =>
      pipe(
        Effect.allPar([
          Effect.request(GetValue({}), GetValueResolver),
          Effect.request(GetValue({}), GetValueResolver),
          Effect.request(GetValue({}), GetValueResolver),
          Effect.request(GetValue({}), GetValueResolver),
          Effect.request(GetValue({}), GetValueResolver),
        ]),
        Effect.mapError(() => Http.notFoundError("File not found")),
        Effect.withRequestCache(getValueCache),
        Effect.withRequestCaching("on"),
        Effect.map((values) => values.join(", ")),
      ),
    ),
  ),
);

pipe(
  server,
  Http.listen({ port: 3000 }),
  Logger.withMinimumLogLevel(LogLevel.All),
  Effect.provideServiceEffect(
    GetValueCache,
    Request.makeCache(100, Duration.seconds(5)),
  ),
  Effect.runPromise,
);
