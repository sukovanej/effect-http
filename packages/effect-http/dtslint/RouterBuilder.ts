import type { Schema } from "@effect/schema"
import { Effect } from "effect"
import { Api, Handler, RouterBuilder } from "effect-http"

declare const bodySchema: Schema.Schema<string, string, "R0">

const getArticleEndpoint = Api.get("getArticle", "/article").pipe(
  Api.setResponseBody(bodySchema)
)
const getBookEndpoint = Api.get("getBook", "/book")

const api = Api.make().pipe(
  Api.addEndpoint(getArticleEndpoint),
  Api.addEndpoint(getBookEndpoint)
)

declare const getArticleHandler: Handler.Handler<typeof getArticleEndpoint, "E1", "R1" | "R2">
declare const getBookHandler: Handler.Handler<typeof getBookEndpoint, "E2" | "E3", "R3">

// $ExpectType RouterBuilder<never, "E1" | "E2" | "E3", "R0" | "R1" | "R2" | "R3">
RouterBuilder.make(api).pipe(
  RouterBuilder.handle(getArticleHandler, getBookHandler)
)

const handler1 = Handler.make(getArticleEndpoint, () => Effect.succeed("article"))
const handler2 = Handler.make(getBookEndpoint, () => Effect.void)

// $ExpectType RouterBuilder<never, never, "R0">
RouterBuilder.make(api).pipe(
  RouterBuilder.handle(handler1, handler2)
)

const api2 = Api.make().pipe(
  Api.addEndpoint(getBookEndpoint)
)

// $ExpectType Default<never, SwaggerFiles>
RouterBuilder.make(api2).pipe(
  RouterBuilder.handle(handler2),
  RouterBuilder.build
)
