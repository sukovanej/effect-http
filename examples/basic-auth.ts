import { runMain } from "@effect/platform-node/Runtime"
import { Schema } from "@effect/schema"
import { Config, ConfigError, Context, Effect, Either, Option, pipe, ReadonlyArray } from "effect"
import { Api, Middlewares, NodeServer, RouterBuilder, ServerError } from "effect-http"

import { debugLogger } from "./_utils.js"

export const CredentialsConfig = Config.mapOrFail(
  Config.string(),
  (credentials) => {
    const parts = credentials.split(":")

    if (parts.length !== 2) {
      return Either.left(ConfigError.InvalidData([], "Unexpected credential"))
    }

    return Either.right({ user: parts[0], password: parts[1] })
  }
)

export const ArrayOfCredentialsConfig = pipe(
  Config.mapOrFail(Config.string(), (credentials) => {
    const parts = credentials.split(":")

    if (parts.length !== 2) {
      return Either.left(ConfigError.InvalidData([], "Unexpected credential"))
    }

    return Either.right({ user: parts[0], password: parts[1] })
  }),
  (credentialsConfig) => Config.array(credentialsConfig, "CREDENTIALS")
)

const CredentialsService = Context.Tag<ReadonlyArray<Middlewares.BasicAuthCredentials>>()

const api = pipe(
  Api.api({ title: "Users API" }),
  Api.get("getUser", "/user", {
    response: Schema.string
  })
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("getUser", () => Effect.succeed("hello world")),
  RouterBuilder.build,
  Middlewares.basicAuth((inputCredentials) =>
    pipe(
      Effect.map(
        CredentialsService,
        ReadonlyArray.groupBy(({ user }) => user)
      ),
      Effect.flatMap((creds) =>
        pipe(
          Option.fromNullable(creds[inputCredentials.user]),
          Option.flatMap(
            ReadonlyArray.findFirst(
              (credentials) => credentials.password === inputCredentials.password
            )
          )
        )
      ),
      Effect.mapError(() => ServerError.unauthorizedError("Incorrect user or password"))
    )
  )
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provideServiceEffect(CredentialsService, ArrayOfCredentialsConfig),
  Effect.provide(debugLogger),
  Effect.tapErrorCause(Effect.logError),
  runMain
)

/**
 * run with `CREDENTIALS=user1:pass1,patrik:standa pnpm tsx examples/basic-auth.ts`
 * - VALID:  curl localhost:3000/user\?value=69 -H 'Authorization: Basic dXNlcjE6cGFzczE='
 * - VALID:  curl localhost:3000/user\?value=420 -H 'Authorization: Basic cGF0cmlrOnN0YW5kYQ=='
 * - INVALID curl localhost:3000/user\?value=1 -H 'Authorization: cGF0cmlrOnN0YW5kYQ=='
 * - INVALID curl localhost:3000/user\?value=1 -H 'authorization: Basic aw52ywxpzc1jcmvkzw50awfscw=='
 * - INVALID curl localhost:3000/user\?value=1 -H 'authorization: Basic bWlrZTpicm9rZXI='
 */
