import * as Context from "@effect/data/Context";
import * as Either from "@effect/data/Either";
import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as RA from "@effect/data/ReadonlyArray";
import * as Config from "@effect/io/Config";
import * as ConfigError from "@effect/io/Config/Error";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

export const CredentialsConfig = Config.mapOrFail(
  Config.string(),
  (credentials) => {
    const parts = credentials.split(":");

    if (parts.length !== 2) {
      return Either.left(ConfigError.InvalidData([], "Unexpected credential"));
    }

    return Either.right({ user: parts[0], password: parts[1] });
  },
);

export const ArrayOfCredentialsConfig = pipe(
  Config.mapOrFail(Config.string(), (credentials) => {
    const parts = credentials.split(":");

    if (parts.length !== 2) {
      return Either.left(ConfigError.InvalidData([], "Unexpected credential"));
    }

    return Either.right({ user: parts[0], password: parts[1] });
  }),
  (credentialsConfig) => Config.arrayOf(credentialsConfig, "CREDENTIALS"),
);

const CredentialsService = Context.Tag<readonly Http.BasicAuthCredentials[]>();

const api = pipe(
  Http.api({ title: "Users API" }),
  Http.get("getUser", "/user", {
    response: Schema.string,
  }),
);

const server = pipe(
  api,
  Http.server,
  Http.handle("getUser", () => Effect.succeed("hello world")),
  Http.addExtension(
    Http.basicAuthExtension((inputCredentials) =>
      pipe(
        Effect.map(
          CredentialsService,
          RA.groupBy(({ user }) => user),
        ),
        Effect.flatMap((creds) =>
          pipe(
            Option.fromNullable(creds[inputCredentials.user]),
            Option.flatMap(
              RA.findFirst(
                (credentials) =>
                  credentials.password === inputCredentials.password,
              ),
            ),
          ),
        ),
        Effect.mapError(() => "Incorrect user or password"),
      ),
    ),
  ),
  Http.exhaustive,
);

pipe(
  server,
  Http.listen({ port: 3000 }),
  Effect.provideServiceEffect(
    CredentialsService,
    Effect.config(ArrayOfCredentialsConfig),
  ),
  Effect.runPromise,
);

/**
 * run with `CREDENTIALS=user1:pass1,patrik:standa pnpm tsx examples/basic-auth.ts`
 * - VALID:  curl localhost:3000/user\?value=69 -H 'Authorization: Basic dXNlcjE6cGFzczE='
 * - VALID:  curl localhost:3000/user\?value=420 -H 'Authorization: Basic cGF0cmlrOnN0YW5kYQ=='
 * - INVALID curl localhost:3000/user\?value=1 -H 'Authorization: cGF0cmlrOnN0YW5kYQ=='
 * - INVALID curl localhost:3000/user\?value=1 -H 'authorization: Basic aw52ywxpzc1jcmvkzw50awfscw=='
 * - INVALID curl localhost:3000/user\?value=1 -H 'authorization: Basic bWlrZTpicm9rZXI='
 */
