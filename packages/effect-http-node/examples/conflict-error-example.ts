import { NodeRuntime } from "@effect/platform-node"
import { Effect, Logger, pipe, Schema } from "effect"
import { Api, Handler, HttpError, Middlewares, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"

class UserRepository extends Effect.Tag("UserRepository")<UserRepository, {
  userExistsByName: (name: string) => Effect.Effect<boolean>
  storeUser: (user: string) => Effect.Effect<void>
}>() {
  static dummy = this.of({
    userExistsByName: () => Effect.succeed(true),
    storeUser: () => Effect.void
  })
}

const storeUserEndpoint = Api.post("storeUser", "/users").pipe(
  Api.setResponseBody(Schema.String),
  Api.setRequestBody(Schema.Struct({ name: Schema.String }))
)

const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(storeUserEndpoint)
)

const storeUserHandler = Handler.make(storeUserEndpoint, ({ body }) =>
  Effect.gen(function*(_) {
    const userRepository = yield* UserRepository

    if (yield* userRepository.userExistsByName(body.name)) {
      return yield* HttpError.conflict(`User "${body.name}" already exists.`)
    }

    yield* userRepository.storeUser(body.name)
    return `User "${body.name}" stored.`
  }))

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle(storeUserHandler),
  RouterBuilder.build,
  Middlewares.errorLog
)

app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provideService(UserRepository, UserRepository.dummy),
  Effect.provide(Logger.pretty),
  NodeRuntime.runMain
)
