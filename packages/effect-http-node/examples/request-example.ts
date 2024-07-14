import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Array, Context, Duration, Effect, pipe, Request, RequestResolver } from "effect"
import { Api, HttpError, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"
import type { FileNotFoundError } from "./_utils.js"
import { debugLogger, readFile } from "./_utils.js"

interface GetValue extends Request.Request<string, FileNotFoundError> {
  readonly _tag: "GetValue"
}
const GetValue = Request.tagged<GetValue>("GetValue")

const GetValueCache = Context.GenericTag<Request.Cache>("@services/GetValueCache")

const GetValueResolver = RequestResolver.fromEffect((_: GetValue) =>
  pipe(
    readFile("test-file"),
    Effect.tap(() => Effect.logDebug("Value read from file"))
  )
)

const requestMyValue = Effect.flatMap(GetValueCache, (getValueCache) =>
  pipe(
    Effect.request(GetValue({}), GetValueResolver),
    Effect.withRequestCache(getValueCache),
    Effect.withRequestCaching(true)
  ))

const api = pipe(
  Api.make(),
  Api.addEndpoint(
    Api.get("getValue", "/value").pipe(Api.setResponseBody(Schema.String))
  )
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("getValue", () =>
    Effect.flatMap(GetValueCache, (getValueCache) =>
      pipe(
        Effect.all(Array.replicate(requestMyValue, 10), {
          concurrency: 10
        }),
        Effect.mapError(() => HttpError.notFound("File not found")),
        Effect.withRequestCache(getValueCache),
        Effect.withRequestCaching(true),
        Effect.map((values) => values.join(", "))
      ))),
  RouterBuilder.build
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provideServiceEffect(
    GetValueCache,
    Request.makeCache({ capacity: 100, timeToLive: Duration.seconds(5) })
  ),
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
