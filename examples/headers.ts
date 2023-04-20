import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as RA from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Ref from "@effect/io/Ref";
import * as Schema from "@effect/schema/Schema";

import * as Http from "../src";

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
      Effect.Do(),
      Effect.bind("usages", () => Effect.flatMap(UsagesService, Ref.get)),
      Effect.bind("timestamp", () =>
        Effect.clockWith((clock) => clock.currentTimeMillis()),
      ),
      Effect.map(({ usages, timestamp }) =>
        pipe(
          usages,
          RA.filter(
            (usage) =>
              usage.clientId === clientId &&
              usage.timestamp > timestamp - RATE_WINDOW,
          ),
          RA.length,
          (usagesPerWindow) => ALLOWED_USAGES_PER_WINDOW - usagesPerWindow,
        ),
      ),
    ),
  recordUsage: (clientId) =>
    pipe(
      Effect.all([
        UsagesService,
        Effect.clockWith((clock) => clock.currentTimeMillis()),
      ]),
      Effect.flatMap(([usages, timestamp]) =>
        Ref.update(usages, (usages) => [...usages, { clientId, timestamp }]),
      ),
    ),
} satisfies Clients;

type Usages = Ref.Ref<ClientUsage[]>;

const ClientsService = Context.Tag<Clients>();
const UsagesService = Context.Tag<Usages>();

const handleHello = ({
  headers: { "x-client-id": clientId },
}: Http.Input<typeof api, "hello">) =>
  pipe(
    Effect.filterOrFail(
      Effect.flatMap(ClientsService, (clients) =>
        pipe(clients.hasAccess(clientId)),
      ),
      (hasAccess) => hasAccess,
      () => Http.unauthorizedError("Wrong api key"),
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
      () => Http.tooManyRequestsError("Rate limit exceeded"),
    ),
    Effect.flatMap(() =>
      Effect.flatMap(ClientsService, (client) => client.recordUsage(clientId)),
    ),
    Effect.as("hello there"),
  );

const api = pipe(
  Http.api(),
  Http.get("hello", "/hello", {
    response: Schema.string,
    headers: { "X-Client-Id": Schema.string },
  }),
);

const server = pipe(
  api,
  Http.server,
  Http.handle("hello", handleHello),
  Http.provideService(ClientsService, clients),
  Http.provideService(UsagesService, Ref.unsafeMake([])),
  Http.exhaustive,
);

pipe(server, Http.listen(3000), Effect.runPromise);
