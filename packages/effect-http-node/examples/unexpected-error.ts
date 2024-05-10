import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Data, Effect } from "effect"
import { Api, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"
import { PrettyLogger } from "effect-log"

export const api = Api.make({ title: "Example API" }).pipe(
  Api.addEndpoint(
    Api.get("root", "/").pipe(Api.setResponseBody(Schema.String))
  )
)

class MyError extends Data.TaggedError("MyError")<{}> {}

export const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle(
    "root",
    () => Effect.fail(new MyError())
  ),
  RouterBuilder.build
)

const program = app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(PrettyLogger.layer())
)

NodeRuntime.runMain(program)
