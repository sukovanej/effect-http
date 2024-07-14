import * as Headers from "@effect/platform/Headers"
import * as HttpServerRequest from "@effect/platform/HttpServerRequest"
import * as Schema from "@effect/schema/Schema"
import * as HttpError from "effect-http-error/HttpError"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import * as Encoding from "effect/Encoding"
import { dual, pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Pipeable from "effect/Pipeable"
import type * as Record from "effect/Record"
import * as Unify from "effect/Unify"
import type * as Security from "../Security.js"

/** @internal */
export const TypeId: Security.TypeId = Symbol.for(
  "effect-http-security/Security/TypeId"
) as Security.TypeId

/** @internal */
export const variance = {
  /* c8 ignore next */
  _A: (_: never) => _,
  /* c8 ignore next */
  _E: (_: never) => _,
  /* c8 ignore next */
  _R: (_: never) => _
}

/** @internal */
export class SecurityImpl<A, E = never, R = never> implements Security.Security<A, E, R> {
  readonly [TypeId] = variance

  constructor(
    readonly openapi: Record.ReadonlyRecord<
      string,
      unknown
    >,
    readonly parser: Security.Security.Handler<A, E, R>
  ) {}

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return Pipeable.pipeArguments(this, arguments)
  }
}

/** @internal */
export const make = <A, E, R>(
  parser: Security.Security.Handler<A, E, R>,
  openapi?: Record.ReadonlyRecord<
    string,
    unknown
  >
): Security.Security<
  A,
  Exclude<E, HttpError.HttpError>,
  Exclude<R, HttpServerRequest.HttpServerRequest>
> => new SecurityImpl(openapi ?? {}, parser)

/** @internal */
export const handleRequest = <A, E, R>(
  security: Security.Security<A, E, R>
): Security.Security.Handler<A, E, R> => (security as SecurityImpl<A, E, R>).parser

/** @internal */
export const getOpenApi = <A, E, R>(
  security: Security.Security<A, E, R>
): Record.ReadonlyRecord<string, unknown> => (security as SecurityImpl<A, E, R>).openapi

/** @internal */
export const mapHandler: typeof Security.mapHandler = dual(
  2,
  <A, B, E1, E2, R1, R2>(
    self: Security.Security<A, E1, R1>,
    f: (
      handler: Security.Security.Handler<A, E1, R1>
    ) => Security.Security.Handler<B, E2, R2>
  ): Security.Security<
    B,
    Exclude<E2, HttpError.HttpError>,
    Exclude<R2, HttpServerRequest.HttpServerRequest>
  > => make(f(handleRequest(self)), getOpenApi(self))
)

/** @internal */
export const and = dual(
  2,
  <A1, E1, R1, A2, E2, R2>(
    self: Security.Security<A1, E1, R1>,
    that: Security.Security<A2, E2, R2>
  ): Security.Security<[A1, A2], E1 | E2, R1 | R2> =>
    make(Effect.all([handleRequest(self), handleRequest(that)]), {
      ...getOpenApi(self),
      ...getOpenApi(that)
    })
)

/** @internal */
export const or = dual(
  2,
  <A1, E1, R1, A2, E2, R2>(
    self: Security.Security<A1, E1, R1>,
    that: Security.Security<A2, E2, R2>
  ): Security.Security<A1 | A2, E1 | E2, R1 | R2> =>
    make(
      Effect.orElse(handleRequest(self), () => handleRequest(that)),
      { ...getOpenApi(self), ...getOpenApi(that) }
    )
)

/** @internal */
export const mapEffect = dual(
  2,
  <A1, E1, R1, A2, E2, R2>(
    self: Security.Security<A1, E1, R1>,
    f: (a: A1) => Effect.Effect<A2, E2, R2>
  ): Security.Security<
    A2,
    E1 | Exclude<E2, HttpError.HttpError>,
    R1 | Exclude<R2, HttpServerRequest.HttpServerRequest>
  > => mapHandler(self, Effect.flatMap(f) as any)
)

/** @internal */
export const mapSchema = dual(
  2,
  <A, B, E, R>(
    self: Security.Security<A, E, R>,
    schema: Schema.Schema<B, A>
  ): Security.Security<B, E, R> => {
    const parse = Schema.decode(schema)

    return make(
      Effect.flatMap(handleRequest(self), (token) =>
        pipe(
          parse(token),
          Effect.mapError((error) => HttpError.unauthorized(`Security parsing error, ${error}`))
        )),
      getOpenApi(self)
    )
  }
)

/** @internal */
export const as = dual(
  2,
  <A, B, E, R>(
    self: Security.Security<A, E, R>,
    value: B
  ): Security.Security<B, E, R> => map(self, () => value)
)

/** @internal */
export const map = dual(
  2,
  <A, B, E, R>(
    self: Security.Security<A, E, R>,
    f: (a: A) => B
  ): Security.Security<B, E, R> => make(Effect.map(handleRequest(self), f), getOpenApi(self))
)

export const asSome = <A, E, R>(
  self: Security.Security<A, E, R>
): Security.Security<Option.Option<A>, E, R> => map(self, Option.some)

/** @internal */
const getAuthorizationHeader = pipe(
  HttpServerRequest.HttpServerRequest,
  Effect.flatMap((request) => Headers.get(request.headers, "authorization")),
  Effect.mapError(() => HttpError.unauthorized("No authorization header"))
)

/** @internal */
const parseAuthorizationHeader = (scheme: string) =>
  Unify.unify((value: string) => {
    const split = value.split(" ")

    if (split.length !== 2) {
      return Effect.fail(HttpError.unauthorized("Invalid authorization header"))
    }

    if (split[0].toLowerCase() !== scheme) {
      return Effect.fail(
        HttpError.unauthorized(`Expected ${scheme.toUpperCase()} authorization`)
      )
    }

    return Effect.succeed(split[1])
  })

/** @internal */
export const bearer = (
  options?: Security.BearerOptions
): Security.Security<string> => {
  const description = options?.description
  const bearerFormat = options?.bearerFormat

  const openApi = {
    [options?.name ?? "bearer"]: {
      type: "http",
      ...(description && { description }),
      ...(bearerFormat && { bearerFormat }),
      scheme: "bearer"
    }
  } as const

  return make(
    Effect.flatMap(getAuthorizationHeader, parseAuthorizationHeader("bearer")),
    openApi
  )
}

/** @internal */
const parseBasicAuthCredentials = Unify.unify((value: string) =>
  pipe(
    Encoding.decodeBase64String(value),
    Either.mapLeft(() => HttpError.unauthorized("Invalid base64-encoded basic authorization")),
    Either.flatMap((value) => {
      const split = value.split(":")

      if (split.length !== 2) {
        return Either.left(
          HttpError.unauthorized(
            `Invalid basic authorization header, expected "user:password".`
          )
        )
      }

      return Either.right({
        user: split[0],
        pass: split[1]
      } as Security.BasicCredentials)
    })
  )
)

/** @internal */
export const basic = (
  options?: Security.BasicOptions
): Security.Security<Security.BasicCredentials> => {
  const description = options?.description

  const openApi = {
    [options?.name ?? "basic"]: {
      type: "http",
      ...(description && { description }),
      scheme: "basic"
    }
  } as const

  return make(
    pipe(
      getAuthorizationHeader,
      Effect.flatMap(parseAuthorizationHeader("basic")),
      Effect.flatMap(parseBasicAuthCredentials)
    ),
    openApi
  )
}

/** @internal */
export const unit: Security.Security<void> = make(Effect.void)

/** @internal */
export const never: Security.Security<never> = make(
  Effect.fail(HttpError.unauthorized("No security"))
)

/** @internal */
export const apiKey = (
  options: Security.ApiKeyOptions
): Security.Security<string> => {
  const schema = Schema.Struct({ [options.key]: Schema.String })

  const parse = pipe(
    options.in === "query"
      ? HttpServerRequest.schemaBodyUrlParams(schema)
      : HttpServerRequest.schemaHeaders(schema),
    Effect.map((obj) => obj[options.key]),
    Effect.mapError(() => HttpError.unauthorized(`Expected ${options.key} (${options.in}) api key`))
  )

  return make(
    parse,
    {
      [options.name ?? "apiKey"]: {
        name: options.key,
        type: "apiKey",
        in: options.in,
        ...(options.description && { description: options.description })
      }
    }
  )
}
