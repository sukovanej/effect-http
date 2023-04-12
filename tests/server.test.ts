import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as S from "@effect/schema/Schema";

import * as Http from "../src";

const Service1 = Context.Tag<number>();
const Service2 = Context.Tag<string>();

const layer1 = Layer.succeed(Service2, "hello world");
const layer2 = pipe(
  Effect.map(Service2, (value) => value.length),
  Effect.toLayer(Service1),
);

test("multiple provideLayer calls", async () => {
  const api = pipe(
    Http.api(),
    Http.get("doStuff", "/stuff", { response: S.number }),
  );

  const server = pipe(
    api,
    Http.server("Test server"),
    Http.handle("doStuff", () => Effect.map(Service1, (value) => value + 2)),
    Http.provideLayer(layer2),
    Http.provideLayer(layer1),
    Http.exhaustive,
  );

  const result = await Effect.runPromise(server.handlers[0].fn({}));

  expect(result).toEqual(13);
});
