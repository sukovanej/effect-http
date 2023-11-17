/**
 * Mechanism for extendning behaviour of all handlers on the server.
 *
 * @since 1.0.0
 */
import * as crypto from "crypto";

import * as Middleware from "@effect/platform/Http/Middleware";
import * as ServerRequest from "@effect/platform/Http/ServerRequest";
import * as ServerResponse from "@effect/platform/Http/ServerResponse";
import type * as Middlewares from "effect-http/Middlewares";
import * as ServerError from "effect-http/ServerError";
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import * as FiberRef from "effect/FiberRef";
import { pipe } from "effect/Function";
import * as HashMap from "effect/HashMap";
import * as Metric from "effect/Metric";

export const accessLog = (level: "Info" | "Warning" | "Debug" = "Info") =>
  Middleware.make((app) =>
    pipe(
      ServerRequest.ServerRequest,
      Effect.flatMap((request) =>
        Effect[`log${level}`](`${request.method} ${request.url}`),
      ),
      Effect.flatMap(() => app),
    ),
  );

export const uuidLogAnnotation = (logAnnotationKey = "requestId") =>
  Middleware.make((app) =>
    pipe(
      Effect.sync(() => crypto.randomUUID()),
      Effect.flatMap((uuid) =>
        FiberRef.update(
          FiberRef.currentLogAnnotations,
          HashMap.set<string, unknown>(logAnnotationKey, uuid),
        ),
      ),
      Effect.flatMap(() => app),
    ),
  );

export const endpointCallsMetric = () => {
  const endpointCalledCounter = Metric.counter("server.endpoint_calls");

  return Middleware.make((app) =>
    Effect.gen(function* (_) {
      const request = yield* _(ServerRequest.ServerRequest);

      yield* _(
        Metric.increment(endpointCalledCounter),
        Effect.tagMetrics("path", request.url),
      );

      return yield* _(app);
    }),
  );
};

export const errorLog = Middleware.make((app) =>
  Effect.gen(function* (_) {
    const request = yield* _(ServerRequest.ServerRequest);

    const response = yield* _(app);

    if (response.status >= 400 && response.status < 500) {
      yield* _(
        Effect.logWarning(
          `${request.method.toUpperCase()} ${request.url} client error ${
            response.status
          }`,
        ),
      );
    } else if (response.status >= 500) {
      yield* _(
        Effect.logError(
          `${request.method.toUpperCase()} ${request.url} server error ${
            response.status
          }`,
        ),
      );
    }

    return response;
  }),
);

export const basicAuth = <R, _>(
  checkCredentials: (
    credentials: Middlewares.BasicAuthCredentials,
  ) => Effect.Effect<R, ServerError.ServerError, _>,
  options?: Partial<{
    headerName: string;
    skipPaths: readonly string[];
  }>,
) =>
  Middleware.make((app) =>
    Effect.gen(function* (_) {
      const headerName = options?.headerName ?? "Authorization";
      const skippedPaths = options?.skipPaths ?? [];
      const request = yield* _(ServerRequest.ServerRequest);

      if (skippedPaths.includes(request.url)) {
        return yield* _(app);
      }

      const authHeader = request.headers[headerName.toLowerCase()];

      if (authHeader === undefined) {
        return ServerError.unauthorizedError(
          `Expected header ${headerName}`,
        ).toServerResponse();
      }

      const authorizationParts = authHeader.split(" ");

      if (authorizationParts.length !== 2) {
        return ServerError.unauthorizedError(
          'Incorrect auhorization scheme. Expected "Basic <credentials>"',
        ).toServerResponse();
      }

      if (authorizationParts[0] !== "Basic") {
        return ServerError.unauthorizedError(
          `Incorrect auhorization type. Expected "Basic", got "${authorizationParts[0]}"`,
        ).toServerResponse();
      }

      const credentialsBuffer = Buffer.from(authorizationParts[1], "base64");
      const credentialsText = credentialsBuffer.toString("utf-8");
      const credentialsParts = credentialsText.split(":");

      if (credentialsParts.length !== 2) {
        return ServerError.unauthorizedError(
          'Incorrect basic auth credentials format. Expected base64 encoded "<user>:<pass>".',
        ).toServerResponse();
      }

      const check = yield* _(
        checkCredentials({
          user: credentialsParts[0],
          password: credentialsParts[1],
        }),
        Effect.either,
      );

      if (Either.isLeft(check)) {
        return check.left.toServerResponse();
      }

      return yield* _(app);
    }),
  );

export const cors = (options?: Partial<Middlewares.CorsOptions>) => {
  const _allowedOrigings = options?.allowedOrigins ?? [];
  const allowedOrigins =
    typeof _allowedOrigings === "string"
      ? [_allowedOrigings]
      : _allowedOrigings;

  return Middleware.make((app) =>
    Effect.gen(function* (_) {
      const request = yield* _(ServerRequest.ServerRequest);
      let response = yield* _(app);

      const url = request.headers["origin"] || request.url;

      if (options?.allowAllOrigins || allowedOrigins.includes(url)) {
        response = response.pipe(
          ServerResponse.setHeaders({
            "Access-Control-Allow-Origin": url,
          }),
        );
      }

      return response;
    }),
  );
};
