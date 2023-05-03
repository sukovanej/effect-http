import * as Context from "@effect/data/Context";
import * as Either from "@effect/data/Either";
import { apply, pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as RA from "@effect/data/ReadonlyArray";
import * as Config from "@effect/io/Config";
import * as ConfigError from "@effect/io/Config/Error";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";

import { unauthorizedError } from "../Server/Errors";
import {
  AuthenticationResult,
  authorized,
  unauthorized,
} from "./Authentication";

export type BasicAuthCredentials = {
  user: string;
  password: string;
};

export interface BasicAuthProvider {
  (credentials: BasicAuthCredentials): Effect.Effect<
    never,
    never,
    AuthenticationResult
  >;
}

export const BasicAuthProviderService = Context.Tag<BasicAuthProvider>(
  "effect-http/basic-auth-provider",
);

export const setBasicAuthProvider = (
  fn: BasicAuthProvider,
): Layer.Layer<never, never, BasicAuthProvider> =>
  Layer.succeed(BasicAuthProviderService, fn);

/** @internal */
export const enhanceHandlerByBasicAuth =
  (headerName = "Authorization") =>
  (headers: Headers) =>
    pipe(
      Option.fromNullable(headers.get(headerName)),
      Effect.mapError(() => unauthorizedError(`Expected header ${headerName}`)),
      Effect.flatMap((authHeader) => {
        const authorizationParts = authHeader.split(" ");

        if (authorizationParts.length !== 2) {
          return Effect.fail(
            unauthorizedError(
              'Incorrect auhorization scheme. Expected "Basic <credentials>"',
            ),
          );
        }

        if (authorizationParts[0] !== "Basic") {
          return Effect.fail(
            unauthorizedError(
              `Incorrect auhorization type. Expected "Basic", got "${authorizationParts[0]}"`,
            ),
          );
        }

        const credentialsBuffer = Buffer.from(authorizationParts[1], "base64");
        const credentialsText = credentialsBuffer.toString("utf-8");
        const credentialsParts = credentialsText.split(":");

        if (credentialsParts.length !== 2) {
          return Effect.fail(
            unauthorizedError(
              'Incorrect basic auth credentials format. Expected base64 encoded "<user>:<pass>".',
            ),
          );
        }

        return Effect.succeed({
          user: credentialsParts[0],
          password: credentialsParts[1],
        });
      }),
      Effect.flatMap((auth) =>
        Effect.flatMap(BasicAuthProviderService, apply(auth)),
      ),
      Effect.flatMap((result) =>
        result.result === "Unauthorized"
          ? Effect.fail(unauthorizedError(result.message))
          : Effect.unit(),
      ),
    );

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

export const basicAuthProviderFromArray = (
  credentialsArray: readonly BasicAuthCredentials[],
) => {
  const crendetialsMap = RA.groupBy(credentialsArray, ({ user }) => user);

  return (inputCredentials: BasicAuthCredentials) =>
    pipe(
      Option.fromNullable(crendetialsMap[inputCredentials.user]),
      Option.flatMap(
        RA.findFirst(
          (credentials) => credentials.password === inputCredentials.password,
        ),
      ),
      Option.match(
        () => unauthorized("Wrong credentials"),
        () => authorized(),
      ),
      Effect.succeed,
    );
};

export const basicAuthStaticConfigProvider = pipe(
  Effect.config(ArrayOfCredentialsConfig),
  Effect.map(basicAuthProviderFromArray),
  Effect.toLayer(BasicAuthProviderService),
);
