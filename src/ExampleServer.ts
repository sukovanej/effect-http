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
import type * as Api from "effect-http/Api";
import type * as RouterBuilder from "effect-http/RouterBuilder";
import * as internal from "effect-http/internal/example-server";

/**
 * Generate an example `RouterBuilder` implementation.
 *
 * @category utils
 * @since 1.0.0
 */
export const make: <A extends Api.Api>(
  api: A,
) => RouterBuilder.RouterBuilder<never, never, never> = internal.make;

/**
 * Create an example implementation for a single endpoint.
 *
 * @category utils
 * @since 1.0.0
 */
export const handle: <
  RemainingEndpoints extends Api.Endpoint,
  Id extends RemainingEndpoints["id"],
>(
  id: Id,
) => <R, E>(
  routerBuilder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>,
) => RouterBuilder.RouterBuilder<
  R,
  E,
  Exclude<RemainingEndpoints, { id: Id }>
> = internal.handle;

/**
 * Create an example implementation for all remaining endpoints.
 *
 * @category utils
 * @since 1.0.0
 */
export const handleRemaining: <RemainingEndpoints extends Api.Endpoint, R, E>(
  routerBuilder: RouterBuilder.RouterBuilder<R, E, RemainingEndpoints>,
) => RouterBuilder.RouterBuilder<R, E, never> = internal.handleRemaining;
