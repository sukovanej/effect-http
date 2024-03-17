/**
 * `Client` implementation derivation for testing purposes.
 *
 * @since 1.0.0
 */
import type * as Api from "./Api.js"
import type * as ApiEndpoint from "./ApiEndpoint.js"
import type * as Client from "./Client.js"
import * as internal from "./internal/mock-client.js"

/**
 * @category models
 * @since 1.0.0
 */
export type Options<A extends Api.Api.Any> = {
  responses: {
    [Id in Api.Api.Ids<A>]: Client.ClientFunctionResponse<
      ApiEndpoint.ApiEndpoint.Response<Api.Api.EndpointById<A, Id>>
    >
  }
}

/**
 * Derive mock client implementation from the `Api`
 *
 * @category constructors
 * @since 1.0.0
 */
export const make: <A extends Api.Api.Any>(
  api: A,
  option?: Partial<Options<A>>
) => Client.Client<A> = internal.make
