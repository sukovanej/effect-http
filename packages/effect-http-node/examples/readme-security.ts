import { NodeRuntime } from "@effect/platform-node"
import { Effect, Logger, LogLevel, Option, Schema } from "effect"
import { Api, Middlewares, RouterBuilder, Security } from "effect-http"
import { NodeServer } from "effect-http-node"

const mySecurity = Security.or(
  Security.asSome(Security.basic()),
  Security.as(Security.unit, Option.none())
)

const mySecuredEnpoint = Api.post("security", "/testSecurity").pipe(
  Api.setResponseBody(Schema.String),
  Api.setSecurity(mySecurity)
)

const api = Api.make().pipe(
  Api.addEndpoint(mySecuredEnpoint)
)

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("security", (_, security) =>
    Effect.succeed(
      Option.match(security, {
        onSome: (creds) => `logged as ${creds.user}`,
        onNone: () => "not logged"
      })
    )),
  RouterBuilder.build,
  Middlewares.errorLog
)

app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain
)
