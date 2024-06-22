/**
 * The `exampleServer` function generates a `Server` implementation based
 * on an instance of `Api`. The listening server will perform all the
 * request and response validations similarly to a real implementation.
 *
 * Responses returned from the server are generated randomly using the
 * response `Schema`.
 *
 * @since 1.0.0
 */
import type * as Schema from "@effect/schema/Schema"
import type * as Effect from "effect/Effect"

import type * as Api from "./Api.js"
import type * as ApiEndpoint from "./ApiEndpoint.js"
import * as internal from "./internal/example-server.js"
import type * as RouterBuilder from "./RouterBuilder.js"

/**
 * Generate an example `RouterBuilder` implementation.
 *
 * @category utils
 * @since 1.0.0
 */
export const make: <A extends Api.Api.Any>(
  api: A
) => RouterBuilder.RouterBuilder<Api.Api.Context<A>, never, never> = internal.make

/**
 * Create an example implementation for a single endpoint.
 *
 * @category utils
 * @since 1.0.0
 */
export const handle: <
  A extends ApiEndpoint.ApiEndpoint.Any,
  Id extends ApiEndpoint.ApiEndpoint.Id<A>
>(
  id: Id
) => <R, E>(
  routerBuilder: RouterBuilder.RouterBuilder<A, E, R>
) => RouterBuilder.RouterBuilder<
  ApiEndpoint.ApiEndpoint.ExcludeById<A, Id>,
  E,
  R | ApiEndpoint.ApiEndpoint.Context<ApiEndpoint.ApiEndpoint.ExtractById<A, Id>>
> = internal.handle

/**
 * Create an example implementation for all remaining endpoints.
 *
 * @category utils
 * @since 1.0.0
 */
export const handleRemaining: <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
  routerBuilder: RouterBuilder.RouterBuilder<A, E, R>
) => RouterBuilder.RouterBuilder<never, E, R | ApiEndpoint.ApiEndpoint.Context<A>> = internal.handleRemaining

/**
 * Generate an example `RouterBuilder` implementation.
 *
 * @category utils
 * @since 1.0.0
 */
export const makeSchema: <A, Encoded, R>(
  schema: Schema.Schema<A, Encoded, R>
) => Effect.Effect<A> = internal.makeSchema
