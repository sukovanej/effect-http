import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Array, Context, Effect, Logger, LogLevel, pipe, Ref } from "effect"
import { Api, HttpError, Middlewares, RouterBuilder } from "effect-http"

import { NodeServer } from "effect-http-node"

interface Clients {
  hasAccess: (clientId: string) => Effect.Effect<boolean>
  getRemainingUsage: (clientId: string) => Effect.Effect<number, never, Usages>
  recordUsage: (aipKey: string) => Effect.Effect<void, never, Usages>
}

const ClientsService = Context.GenericTag<Clients>("@services/ClientsService")

type ClientUsage = {
  clientId: string
  timestamp: number
}

const RATE_WINDOW = 1000 * 30 // 30s
const ALLOWED_USAGES_PER_WINDOW = 5

const clients = ClientsService.of({
  hasAccess: (clientId) => Effect.succeed(clientId === "abc"),
  getRemainingUsage: (clientId) =>
    pipe(
      Effect.all(
        [
          Effect.flatMap(UsagesService, Ref.get),
          Effect.clockWith((clock) => clock.currentTimeMillis)
        ] as const
      ),
      Effect.map(([usages, timestamp]) =>
        pipe(
          usages,
          Array.filter(
            (usage) =>
              usage.clientId === clientId &&
              usage.timestamp > timestamp - RATE_WINDOW
          ),
          Array.length,
          (usagesPerWindow) => ALLOWED_USAGES_PER_WINDOW - usagesPerWindow
        )
      )
    ),
  recordUsage: (clientId) =>
    pipe(
      Effect.all(
        [
          UsagesService,
          Effect.clockWith((clock) => clock.currentTimeMillis)
        ] as const
      ),
      Effect.flatMap(([usages, timestamp]) => Ref.update(usages, (usages) => [...usages, { clientId, timestamp }]))
    )
})

type Usages = Ref.Ref<Array<ClientUsage>>

const UsagesService = Context.GenericTag<Usages>("@services/UsagesService")

export const api = pipe(
  Api.make(),
  Api.addEndpoint(
    Api.post("hello", "/hello").pipe(
      Api.setResponseBody(Schema.String),
      Api.setRequestBody(Schema.Struct({ value: Schema.Number })),
      Api.setRequestHeaders(Schema.Struct({ "x-client-id": Schema.String }))
    )
  )
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("hello", ({ headers: { "x-client-id": clientId } }) =>
    pipe(
      Effect.filterOrFail(
        Effect.flatMap(ClientsService, (clients) => clients.hasAccess(clientId)),
        (hasAccess) => hasAccess,
        () => HttpError.unauthorized("Wrong api key")
      ),
      Effect.flatMap(() => Effect.flatMap(ClientsService, (client) => client.getRemainingUsage(clientId))),
      Effect.tap((remainingUsages) => Effect.log(`Remaining ${remainingUsages} usages.`)),
      Effect.filterOrFail(
        (remainingUsages) => remainingUsages > 0,
        () => HttpError.tooManyRequests("Rate limit exceeded")
      ),
      Effect.flatMap(() => Effect.flatMap(ClientsService, (client) => client.recordUsage(clientId))),
      Effect.as("hello there")
    )),
  RouterBuilder.build,
  Middlewares.errorLog,
  Middlewares.accessLog(LogLevel.Debug)
)

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provideService(ClientsService, clients),
  Effect.provideServiceEffect(UsagesService, Ref.make([] as Array<ClientUsage>)),
  Effect.provide(Logger.pretty),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain
)
