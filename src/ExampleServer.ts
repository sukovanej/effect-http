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
 * Generate an example Server implementation.
 *
 * @category constructors
 * @since 1.0.0
 */
export const make: <A extends Api.Api>(
  api: A,
) => RouterBuilder.RouterBuilder<never, never, never> = internal.make;
