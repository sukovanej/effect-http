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
) => RouterBuilder.RouterBuilder<Api.Api.Requirements<A>, never, never> = internal.make

/**
 * Create an example implementation for a single endpoint.
 *
 * @category utils
 * @since 1.0.0
 */
export const handle: <
  RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any,
  Id extends ApiEndpoint.ApiEndpoint.Id<RemainingEndpoints>
>(
  id: Id
) => <R, E>(
  routerBuilder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>
) => RouterBuilder.RouterBuilder<
  R | ApiEndpoint.ApiEndpoint.Requirements<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>>,
  E,
  ApiEndpoint.ApiEndpoint.ExcludeById<RemainingEndpoints, Id>
> = internal.handle

/**
 * Create an example implementation for all remaining endpoints.
 *
 * @category utils
 * @since 1.0.0
 */
export const handleRemaining: <RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any, R, E>(
  routerBuilder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>
) => RouterBuilder.RouterBuilder<R | ApiEndpoint.ApiEndpoint.Requirements<RemainingEndpoints>, E, never> =
  internal.handleRemaining
