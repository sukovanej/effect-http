import * as HttpRouter from "@effect/platform/HttpRouter"
import * as Array from "effect/Array"
import * as Effect from "effect/Effect"
import { dual, pipe } from "effect/Function"
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
  _E: (_: never) => _,
  /* c8 ignore next */
  _R: (_: never) => _
}

/** @internal */
class HandlerImpl<A extends ApiEndpoint.ApiEndpoint.Any, E, R> implements Handler.Handler<A, E, R> {
  readonly [TypeId] = variance

  constructor(readonly endpoints: ReadonlyArray<A>, readonly router: HttpRouter.HttpRouter<E, R>) {}

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
}

/** @internal */
export const empty = new HandlerImpl([], HttpRouter.empty) as unknown as Handler.Handler<never, never, never> // TODO check variance

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
  const route = HttpRouter.makeRoute(ApiEndpoint.getMethod(endpoint), ApiEndpoint.getPath(endpoint), handler)
  return new HandlerImpl([endpoint], HttpRouter.fromIterable([route]))
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
export const getRouter = <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
  handler: Handler.Handler<A, E, R>
): HttpRouter.HttpRouter<E, R> => (handler as HandlerImpl<A, E, R>).router

/** @internal */
export const getEndpoints = <A extends ApiEndpoint.ApiEndpoint.Any, E, R>(
  handler: Handler.Handler<A, E, R>
): ReadonlyArray<A> => (handler as HandlerImpl<A, E, R>).endpoints

/** @internal */
export const concat: {
  <A extends ApiEndpoint.ApiEndpoint.Any, B extends ApiEndpoint.ApiEndpoint.Any, E1, E2, R1, R2>(
    self: Handler.Handler<A, E1, R1>,
    handler: Handler.Handler<B, E2, R2>
  ): Handler.Handler<A | B, E1 | E2, R1 | R2>

  <B extends ApiEndpoint.ApiEndpoint.Any, E2, R2>(
    handler: Handler.Handler<B, E2, R2>
  ): <A extends ApiEndpoint.ApiEndpoint.Any, E1, R1>(
    self: Handler.Handler<A, E1, R1>
  ) => Handler.Handler<A | B, E1 | E2, R1 | R2>
} = dual(2, <A extends ApiEndpoint.ApiEndpoint.Any, B extends ApiEndpoint.ApiEndpoint.Any, E1, E2, R1, R2>(
  self: Handler.Handler<A, E1, R1>,
  handler: Handler.Handler<B, E2, R2>
): Handler.Handler<A | B, E1 | E2, R1 | R2> =>
  new HandlerImpl(
    [...getEndpoints(self), ...getEndpoints(handler)],
    HttpRouter.concat(getRouter(self), getRouter(handler))
  ))

/** @internal */
export const concatAll = <Handlers extends ReadonlyArray<Handler.Handler.Any>>(
  ...handlers: Handlers
): Handler.Handler<
  Handler.Handler.Endpoint<Handlers[number]>,
  Handler.Handler.Error<Handlers[number]>,
  Handler.Handler.Context<Handlers[number]>
> =>
  new HandlerImpl(
    Array.flatten(handlers.map(getEndpoints)),
    handlers.map(getRouter).reduce(HttpRouter.concat, HttpRouter.empty)
  )
