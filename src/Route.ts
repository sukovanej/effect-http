/**
 * Create @effect/platform/Http/Router `Router`
 *
 * @since 1.0.0
 */
import * as Method from "@effect/platform/Http/Method";
import * as Router from "@effect/platform/Http/Router";
import * as ServerRequest from "@effect/platform/Http/ServerRequest";
import { Effect, Types, pipe } from "effect";
import * as Api from "effect-http/Api";
import * as ServerError from "effect-http/ServerError";
import * as ServerRequestParser from "effect-http/internal/serverRequestParser";
import * as ServerResponseEncoder from "effect-http/internal/serverResponseEncoder";

import { AnySchema, SchemaTo } from "./internal/utils";

/**
 * @category models
 * @since 1.0.0
 */
export type HandlerFunction<Endpoint extends Api.Endpoint, R, E> = (
  input: Types.Simplify<EndpointSchemasTo<Endpoint["schemas"]>["request"]>,
) => Effect.Effect<
  R,
  E,
  EndpointResponseSchemaTo<Endpoint["schemas"]["response"]>
>;

/**
 * @category constructors
 * @since 1.0.0
 */
export const fromEndpoint: <Endpoint extends Api.Endpoint, R, E>(
  fn: HandlerFunction<Endpoint, R, E>,
) => (
  endpoint: Endpoint,
) => Router.Route<R, Exclude<E, ServerError.ServerError>> =
  <Endpoint extends Api.Endpoint, R, E>(fn: HandlerFunction<Endpoint, R, E>) =>
  (endpoint) => {
    const responseEncoder = ServerResponseEncoder.create(
      endpoint.schemas.response,
    );
    const requestParser = ServerRequestParser.create(endpoint);

    return Router.makeRoute(
      endpoint.method.toUpperCase() as Method.Method,
      endpoint.path,
      pipe(
        ServerRequest.ServerRequest,
        Effect.flatMap(requestParser.parseRequest),
        Effect.flatMap((input: any) => fn(input)),
        Effect.flatMap(responseEncoder.encodeResponse),
        Effect.catchAll((error) => {
          if (ServerError.isServerError(error)) {
            return error.toServerResponse();
          }

          return Effect.fail(error as Exclude<E, ServerError.ServerError>);
        }),
        Effect.tapError(Effect.logError),
      ),
    );
  };

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: <
  A extends Api.Api,
  Id extends A["endpoints"][number]["id"],
  R,
  E,
>(
  id: Id,
  fn: HandlerFunction<Extract<A["endpoints"][number], { id: Id }>, R, E>,
) => (api: A) => Router.Route<R, Exclude<E, ServerError.ServerError>> =
  (id, fn) => (api) => {
    const endpoint = Api.getEndpoint(api, id);

    if (endpoint === undefined) {
      throw new Error(`Operation id ${id} not found`);
    }

    return fromEndpoint(fn)(endpoint);
  };

// TODO move somewhere else

/** @internal */
export const addRoute = <R1, R2, E1, E2>(
  router: Router.Router<R1, E1>,
  route: Router.Route<R2, E2>,
): Router.Router<
  Exclude<R1 | R2, Router.RouteContext | ServerRequest.ServerRequest>,
  E1 | E2
> => Router.concat(Router.fromIterable([route]))(router) as any;

/** @ignore */
export type EndpointResponseSchemaTo<S> = S extends AnySchema
  ? SchemaTo<S>
  : S extends readonly Api.ResponseSchemaFull[]
    ? ResponseSchemaFullTo<S[number]>
    : S extends Api.ResponseSchemaFull
      ? ResponseSchemaFullTo<S>
      : never;

/** @ignore */
export type ResponseSchemaFullTo<S extends Api.ResponseSchemaFull> =
  S extends any
    ? Types.Simplify<
        {
          status: S["status"];
        } & {
          [K in Exclude<RequiredFields<S>, "status">]: S[K] extends AnySchema
            ? SchemaTo<S[K]>
            : never;
        }
      >
    : never;

export type RequiredFields<E> = {
  [K in keyof E]: E[K] extends Api.IgnoredSchemaId ? never : K;
}[keyof E];

/** @ignore */
export type EndpointSchemasTo<E extends Api.Endpoint["schemas"]> =
  Types.Simplify<{
    response: EndpointResponseSchemaTo<E["response"]>;
    request: {
      [K in Extract<
        keyof E["request"],
        RequiredFields<E["request"]>
      >]: SchemaTo<E["request"][K]>;
    };
  }>;
