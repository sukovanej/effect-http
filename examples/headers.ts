import { runMain } from "@effect/platform-node/Runtime";
import { Schema } from "@effect/schema";
import { Context, Effect, ReadonlyArray, Ref, pipe } from "effect";
import { Api, NodeServer, RouterBuilder, ServerError } from "effect-http";

import { debugLogger } from "./_utils";

interface Clients {
  hasAccess: (clientId: string) => Effect.Effect<never, never, boolean>;
  getRemainingUsage: (clientId: string) => Effect.Effect<Usages, never, number>;
  recordUsage: (aipKey: string) => Effect.Effect<Usages, never, void>;
}

type ClientUsage = {
  clientId: string;
  timestamp: number;
};

const RATE_WINDOW = 1000 * 30; // 30s
const ALLOWED_USAGES_PER_WINDOW = 5;

const clients = {
  hasAccess: (clientId) => Effect.succeed(clientId === "abc"),
  getRemainingUsage: (clientId) =>
    pipe(
      Effect.all([
        Effect.flatMap(UsagesService, Ref.get),
        Effect.clockWith((clock) => clock.currentTimeMillis),
      ] as const),
      Effect.map(([usages, timestamp]) =>
        pipe(
          usages,
          ReadonlyArray.filter(
            (usage) =>
              usage.clientId === clientId &&
              usage.timestamp > timestamp - RATE_WINDOW,
          ),
          ReadonlyArray.length,
          (usagesPerWindow) => ALLOWED_USAGES_PER_WINDOW - usagesPerWindow,
        ),
      ),
    ),
  recordUsage: (clientId) =>
    pipe(
      Effect.all([
        UsagesService,
        Effect.clockWith((clock) => clock.currentTimeMillis),
      ] as const),
      Effect.flatMap(([usages, timestamp]) =>
        Ref.update(usages, (usages) => [...usages, { clientId, timestamp }]),
      ),
    ),
} satisfies Clients;

type Usages = Ref.Ref<ClientUsage[]>;

const ClientsService = Context.Tag<Clients>();
const UsagesService = Context.Tag<Usages>();

export const api = pipe(
  Api.api(),
  Api.post("hello", "/hello", {
    response: Schema.string,
    request: {
      body: Schema.struct({ value: Schema.number }),
      headers: Schema.struct({ "X-Client-Id": Schema.string }),
    },
  }),
);

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("hello", ({ headers: { "x-client-id": clientId } }) =>
    pipe(
      Effect.filterOrFail(
        Effect.flatMap(ClientsService, (clients) =>
          clients.hasAccess(clientId),
        ),
        (hasAccess) => hasAccess,
        () => ServerError.unauthorizedError("Wrong api key"),
      ),
      Effect.flatMap(() =>
        Effect.flatMap(ClientsService, (client) =>
          client.getRemainingUsage(clientId),
        ),
      ),
      Effect.tap((remainingUsages) =>
        Effect.log(`Remaining ${remainingUsages} usages.`),
      ),
      Effect.filterOrFail(
        (remainingUsages) => remainingUsages > 0,
        () => ServerError.tooManyRequestsError("Rate limit exceeded"),
      ),
      Effect.flatMap(() =>
        Effect.flatMap(ClientsService, (client) =>
          client.recordUsage(clientId),
        ),
      ),
      Effect.as("hello there"),
    ),
  ),
  RouterBuilder.build,
);

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provideService(ClientsService, clients),
  Effect.provideServiceEffect(UsagesService, Ref.make([] as ClientUsage[])),
  Effect.provide(debugLogger),
  runMain,
);
