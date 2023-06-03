import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";

import * as Http from "effect-http";

const api = pipe(Http.api());
const server = pipe(api, Http.server, Http.listen({ logger: "json" }));

Effect.runPromise(server);
