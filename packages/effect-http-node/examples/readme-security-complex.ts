import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, Fiber, Layer, pipe, Schedule } from "effect"
import { Api, Client, Middlewares, RouterBuilder, Security } from "effect-http"
import { NodeServer } from "effect-http-node"

interface UserInfo {
  email: string
}

class UserStorage extends Effect.Tag("UserStorage")<
  UserStorage,
  { getInfo: (user: string) => Effect.Effect<UserInfo> }
>() {
  static dummy = Layer.succeed(
    UserStorage,
    UserStorage.of({
      getInfo: (_: string) => Effect.succeed({ email: "email@gmail.com" })
    })
  )
}

const mySecurity = pipe(
  Security.basic({ description: "My basic auth" }),
  Security.map((creds) => creds.user),
  Security.mapEffect((user) => UserStorage.getInfo(user))
)

const api = Api.make().pipe(
  Api.addEndpoint(
    pipe(
      Api.post("endpoint", "/endpoint"),
      Api.setResponseBody(Schema.String),
      Api.setSecurity(mySecurity)
    )
  )
)

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle(
    "endpoint",
    (_, security) => Effect.succeed(`Logged as ${security.email}`)
  ),
  RouterBuilder.build,
  Middlewares.errorLog
)

Effect.gen(function*(_) {
  const fiber = yield* _(app, NodeServer.listen({ port: 3000 }), Effect.fork)

  const client = Client.make(api, { baseUrl: "http://localhost:3000" })

  yield* _(
    client.endpoint({}, Client.setBasic("patrik", "slepice")),
    Effect.catchAllDefect(Effect.fail),
    Effect.onError((e) => Effect.logWarning(`Api call failed with ${e}`)),
    Effect.retry({ schedule: Schedule.spaced("1 second") }),
    Effect.flatMap((response) => Effect.log(`Api call succeeded with ${response}`))
  )

  yield* _(Fiber.join(fiber))
}).pipe(
  Effect.provide(UserStorage.dummy),
  NodeRuntime.runMain
)
