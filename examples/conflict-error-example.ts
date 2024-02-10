import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Context, Effect, pipe } from "effect"
import { Api, Middlewares, NodeServer, RouterBuilder, ServerError } from "effect-http"

import { debugLogger } from "./_utils.js"

const api = pipe(
  Api.api({ title: "Users API" }),
  Api.post("storeUser", "/users", {
    response: Schema.string,
    request: {
      body: Schema.struct({ name: Schema.string })
    }
  })
)

interface UserRepository {
  existsByName: (name: string) => Effect.Effect<boolean>
  store: (user: string) => Effect.Effect<void>
}

const UserRepository = Context.GenericTag<UserRepository>("@services/UserRepository")

const mockUserRepository = UserRepository.of({
  existsByName: () => Effect.succeed(true),
  store: () => Effect.unit
})

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("storeUser", ({ body }) =>
    pipe(
      Effect.flatMap(UserRepository, (userRepository) => userRepository.existsByName(body.name)),
      Effect.filterOrFail(
        (alreadyExists) => !alreadyExists,
        () => ServerError.conflictError(`User "${body.name}" already exists.`)
      ),
      Effect.flatMap(() => Effect.flatMap(UserRepository, (repository) => repository.store(body.name))),
      Effect.map(() => `User "${body.name}" stored.`)
    )),
  RouterBuilder.build,
  Middlewares.errorLog
)

app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provideService(UserRepository, mockUserRepository),
  Effect.provide(debugLogger),
  NodeRuntime.runMain
)
