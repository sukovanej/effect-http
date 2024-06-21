/**
 * HTTP API service declaration.
 *
 * @since 1.0.0
 */
export * as Api from "./Api.js"

/**
 * HTTP endpoint declaration.
 *
 * @since 1.0.0
 */
export * as ApiEndpoint from "./ApiEndpoint.js"

/**
 * Api groups.
 *
 * @since 1.0.0
 */
export * as ApiGroup from "./ApiGroup.js"

/**
 * HTTP request declaration.
 *
 * @since 1.0.0
 */
export * as ApiRequest from "./ApiRequest.js"

/**
 * HTTP response declaration.
 *
 * @since 1.0.0
 */
export * as ApiResponse from "./ApiResponse.js"

/**
 * @since 1.0.0
 */
export * as ApiSchema from "./ApiSchema.js"

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
 * Server side handler implementation of an endpoint.
 *
 * @since 1.0.0
 */
export * as Handler from "./Handler.js"

/**
 * HTTP errors.
 *
 * @since 1.0.0
 */
export * as HttpError from "./HttpError.js"

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
 * @category models
 * @since 1.0.0
 */
export * as OpenApiTypes from "./OpenApiTypes.js"

/**
 * `Representation` is a data structure holding information about how to
 * serialize and deserialize a server response for a given conten type.
 *
 * @since 1.0.0
 */
export * as Representation from "./Representation.js"

/**
 * Build a `Router` satisfying an `Api.Api`.
 *
 * @since 1.0.0
 */
export * as RouterBuilder from "./RouterBuilder.js"

/**
 * Authentication and authorization.
 * @since 1.0.0
 */
export * as Security from "./Security.js"

/**
 * Create a router serving Swagger files.
 *
 * @since 1.0.0
 */
export * as SwaggerRouter from "./SwaggerRouter.js"
