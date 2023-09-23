/**
 * Create @effect/platform/Http/Router `Router`
 *
 * @since 1.0.0
 */
import * as Method from "@effect/platform/Http/Method";
import * as Router from "@effect/platform/Http/Router";
import * as ServerRequest from "@effect/platform/Http/ServerRequest";
import * as ServerResponse from "@effect/platform/Http/ServerResponse";
import { Effect, Types, pipe } from "effect";
import { Api, Endpoint } from "effect-http/Api";
import {
  EndpointResponseSchemaTo,
  EndpointSchemasTo,
  SelectEndpointById,
} from "effect-http/ServerBuilder";
import { ApiError } from "effect-http/ServerError";
import { ResponseUtil, responseUtil } from "effect-http/Utils";
import * as ServerRequestParser from "effect-http/internal/serverRequestParser";
import * as ServerResponseEncoder from "effect-http/internal/serverResponseEncoder";

type InputFn<En extends Endpoint, R> = (
  input: Types.Simplify<
    EndpointSchemasTo<En["schemas"]>["request"] & {
      ResponseUtil: ResponseUtil<En>;
    }
  >,
) => Effect.Effect<
  R,
  ApiError,
  EndpointResponseSchemaTo<En["schemas"]["response"]>
>;

/**
 * @since 1.0.0
 */
export const make: <A extends Api, Id extends A["endpoints"][number]["id"], R>(
  id: Id,
  fn: InputFn<SelectEndpointById<A["endpoints"], Id>, R>,
) => (api: A) => Router.Route<R, never> = (id, fn) => (api) => {
  const endpoint = api.endpoints.find(({ id: _id }) => _id === id);

  if (endpoint === undefined) {
    throw new Error(`Operation id ${id} not found`);
  }

  const responseEncoder = ServerResponseEncoder.create(
    endpoint.schemas.response,
  );
  const requestParser = ServerRequestParser.create(endpoint);

  const ResponseUtil = responseUtil(api, id);

  return Router.makeRoute(
    endpoint.method.toUpperCase() as Method.Method,
    endpoint.path,
    pipe(
      ServerRequest.ServerRequest,
      Effect.flatMap(requestParser.parseRequest),
      Effect.let("ResponseUtil", () => ResponseUtil),
      Effect.flatMap((input: any) => fn(input)),
      Effect.flatMap(responseEncoder.encodeResponse),
      Effect.catchTags({
        InvalidQueryError: (error) =>
          Effect.succeed(ServerResponse.unsafeJson(error, { status: 400 })),
        InvalidBodyError: (error) =>
          Effect.succeed(ServerResponse.unsafeJson(error, { status: 400 })),
        InvalidHeadersError: (error) =>
          Effect.succeed(ServerResponse.unsafeJson(error, { status: 400 })),
        InvalidParamsError: (error) =>
          Effect.succeed(ServerResponse.unsafeJson(error, { status: 400 })),
        InvalidResponseError: (error) =>
          Effect.succeed(ServerResponse.unsafeJson(error, { status: 500 })),
      }),
      Effect.tapError(Effect.logError),
      Effect.catchAll((error) =>
        ServerResponse.unsafeJson(error).pipe(Effect.succeed),
      ),
    ),
  );
};
