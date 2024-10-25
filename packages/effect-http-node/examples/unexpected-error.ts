import { NodeRuntime } from "@effect/platform-node"
import { Data, Effect, Logger, Schema } from "effect"
import { Api, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

export const api = Api.make({ title: "Example API" }).pipe(
  Api.addEndpoint(
    Api.get("root", "/").pipe(Api.setResponseBody(Schema.String))
  )
)

class MyError extends Data.TaggedError("MyError")<{ message: string }> {}

export const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle(
    "root",
    () => Effect.fail(new MyError({ message: "Unexpected error" }))
  ),
  RouterBuilder.build
)

const program = app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(Logger.pretty)
)

NodeRuntime.runMain(program)
