import * as HttpRouter from "@effect/platform/HttpRouter"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Pipeable from "effect/Pipeable"

import * as ApiEndpoint from "../ApiEndpoint.js"
import type * as Handler from "../Handler.js"
import * as HttpError from "../HttpError.js"
import * as ServerRequestParser from "./serverRequestParser.js"
import * as ServerResponseEncoder from "./serverResponseEncoder.js"

/** @internal */
export const TypeId: Handler.TypeId = Symbol.for(
  "effect-http/Handler/TypeId"
) as Handler.TypeId

/** @internal */
export const variance = {
  /* c8 ignore next */
  _A: (_: any) => _,
  /* c8 ignore next */
  _E: (_: any) => _,
  /* c8 ignore next */
  _R: (_: any) => _
}

/** @internal */
class HandlerImpl<A extends ApiEndpoint.ApiEndpoint.Any, E, R> implements Handler.Handler<A, E, R> {
  readonly [TypeId] = variance

  constructor(readonly endpoint: A, readonly route: HttpRouter.Route<E, R>) {}

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
}

/** @internal */
export const make: {
  <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
    fn: Handler.Handler.Function<A, E, R>,
    options?: Partial<Handler.Options>
  ): (endpoint: A) => Handler.Handler<A, Exclude<E, HttpError.HttpError>, R>
  <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
    endpoint: A,
    fn: Handler.Handler.Function<A, E, R>,
    options?: Partial<Handler.Options>
  ): Handler.Handler<A, Exclude<E, HttpError.HttpError>, R>
} = (...args: readonly [any, any]) => {
  if (ApiEndpoint.isApiEndpoint(args[0])) {
    return _make(...args) as any
  }

  return (endpoint) => _make(endpoint, ...args)
}

/** @internal */
export const makeRaw: {
  <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
    handler: HttpRouter.Route.Handler<E, R>
  ): (endpoint: A) => Handler.Handler<A, E, R>
  <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
    endpoint: A,
    handler: HttpRouter.Route.Handler<E, R>
  ): Handler.Handler<A, E, R>
} = (...args: ReadonlyArray<any>) => {
  if (ApiEndpoint.isApiEndpoint(args[0])) {
    return _makeRaw(...args as [any, any]) as any
  }

  return (endpoint) => _makeRaw(endpoint, args[0])
}

/** @internal */
const _makeRaw = <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
  endpoint: A,
  handler: HttpRouter.Route.Handler<E, R>
): Handler.Handler<A, E, R> => {
  const router = HttpRouter.makeRoute(ApiEndpoint.getMethod(endpoint), ApiEndpoint.getPath(endpoint), handler)
  return new HandlerImpl(endpoint, router)
}

/** @internal */
const _make = <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
  endpoint: A,
  fn: Handler.Handler.Function<A, E, R>,
  options?: Partial<Handler.Options>
): Handler.Handler<A, E, R> => {
  const responseEncoder = ServerResponseEncoder.create(endpoint)
  const requestParser = ServerRequestParser.create(endpoint, options?.parseOptions)

  const handler = pipe(
    requestParser.parseRequest,
    Effect.flatMap((input: any) => {
      const { security, ...restInput } = input
      return fn(restInput, security)
    }),
    Effect.flatMap((response) => responseEncoder.encodeResponse(response)),
    Effect.catchAll((error) => {
      if (HttpError.isHttpError(error)) {
        return HttpError.toResponse(error)
      }

      return Effect.fail(error as Exclude<E, HttpError.HttpError>)
    })
  )

  return _makeRaw(endpoint, handler)
}

/** @internal */
export const getRoute = <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
  handler: Handler.Handler<A, E, R>
): HttpRouter.Route<E, R> => (handler as HandlerImpl<A, E, R>).route

/** @internal */
export const getEndpoint = <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
  handler: Handler.Handler<A, E, R>
): A => (handler as HandlerImpl<A, E, R>).endpoint
