import * as NodeContext from "@effect/platform-node/NodeContext"
import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer"
import type * as HttpApp from "@effect/platform/HttpApp"
import * as HttpServer from "@effect/platform/HttpServer"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { createServer } from "http"

import type * as NodeServer from "../NodeServer.js"
import * as NodeSwaggerFiles from "../NodeSwaggerFiles.js"

/** @internal */
const DEFAULT_LISTEN_OPTIONS: NodeServer.Options = {
  port: undefined
}

/** @internal */
export const listen = (options?: Partial<NodeServer.Options>) => <R, E>(router: HttpApp.Default<E, R>) =>
  pipe(
    HttpServer.logAddress,
    Effect.flatMap(() => Layer.launch(HttpServer.serve(router))),
    Effect.scoped,
    Effect.provide(NodeHttpServer.layer(() => createServer(), { ...DEFAULT_LISTEN_OPTIONS, ...options })),
    Effect.provide(NodeSwaggerFiles.SwaggerFilesLive),
    Effect.provide(NodeContext.layer)
  )
