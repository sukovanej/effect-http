import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Context, Effect, pipe } from "effect"
import { Api, Middlewares, RouterBuilder, ServerError } from "effect-http"

import { NodeServer } from "effect-http-node"
import { debugLogger } from "./_utils.js"

const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(
    Api.post("storeUser", "/users").pipe(
      Api.setResponseBody(Schema.string),
      Api.setRequestBody(Schema.struct({ name: Schema.string }))
    )
  )
)

interface UserRepository {
  userExistsByName: (name: string) => Effect.Effect<boolean>
  storeUser: (user: string) => Effect.Effect<void>
}

const UserRepository = Context.GenericTag<UserRepository>("UserRepository")

const mockUserRepository = UserRepository.of({
  userExistsByName: () => Effect.succeed(true),
  storeUser: () => Effect.unit
})

const { storeUser, userExistsByName } = Effect.serviceFunctions(UserRepository)

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("storeUser", ({ body }) =>
    pipe(
      userExistsByName(body.name),
      Effect.filterOrFail(
        (alreadyExists) => !alreadyExists,
        () => ServerError.conflictError(`User "${body.name}" already exists.`)
      ),
      Effect.andThen(storeUser(body.name)),
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
