/**
 * `Api` represents the API specification. It doesn't hold information concerning the
 * server or client side details. An instance of `Api` can be used to derive a client
 * implementation (see `Client.ts`).
 *
 * The generated type of the `Api` is used during server implementation. The type safety
 * guarantees the server-side implementation and the `Api` specification are compatible.
 *
 * @since 1.0.0
 */
export * as Api from "./Api.js"

/**
 * This module exposes the `client` combinator which accepts an `Api` instance
 * and it generates a client-side implementation. The generated implementation
 * is type-safe and guarantees compatibility of the client and server side.
 *
 * @since 1.0.0
 */
export * as Client from "./Client.js"

/**
 * Models for errors being created on the client side.
 *
 * @since 1.0.0
 */
export * as ClientError from "./ClientError.js"

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
export * as ExampleServer from "./ExampleServer.js"

/**
 * Mechanism for extendning behaviour of all handlers on the server.
 *
 * @since 1.0.0
 */
export * as Middlewares from "./Middlewares.js"

/**
 * `Client` implementation derivation for testing purposes.
 *
 * @since 1.0.0
 */
export * as MockClient from "./MockClient.js"

/**
 * Derivation of `OpenApi` schema from an instance of `Api`.
 *
 * @since 1.0.0
 */
export * as OpenApi from "./OpenApi.js"

/**
 * `Representation` is a data structure holding information about how to
 * serialize and deserialize a server response for a given conten type.
 *
 * @since 1.0.0
 */
export * as Representation from "./Representation.js"

/**
 * Create @effect/platform/Http/Router `Router`
 *
 * @since 1.0.0
 */
export * as Route from "./Route.js"

/**
 * Build a `Router` satisfying an `Api.Api`.
 *
 * @since 1.0.0
 */
export * as RouterBuilder from "./RouterBuilder.js"

/**
 * A security scheme is a way to protect an API from unauthorized access.
 * @since 1.0.0
 */
export * as SecurityScheme from "./SecurityScheme.js"

/**
 * Server errors.
 *
 * @since 1.0.0
 */
export * as ServerError from "./ServerError.js"

/**
 * Create a router serving Swagger files.
 *
 * @since 1.0.0
 */
export * as SwaggerRouter from "./SwaggerRouter.js"

/**
 * Some constructors for secure scheme.
 *
 * @since 1.0.0
 */
export * as SecurityScheme from "./SecurityScheme.js"
