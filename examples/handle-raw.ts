import * as Http from "@effect/platform/HttpServer";
import * as Schema from "@effect/schema/Schema";
import { Effect } from "effect";
import { NodeServer } from "effect-http";
import { RouterBuilder } from "effect-http";
import { Api } from "effect-http";
import { PrettyLogger } from "effect-log";

export const api = Api.api({ title: "Example API" }).pipe(
  Api.get("root", "/", {
    response: {
      status: 200,
      content: Schema.string,
      headers: Schema.struct({ "Content-Type": Schema.string }),
    },
  }),
);

export const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handleRaw(
    "root",
    Http.response.text("Hello World!", {
      status: 200 as const,
      headers: { "content-type": "text/plain" },
    }),
  ),
  RouterBuilder.build,
);

const program = app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(PrettyLogger.layer()),
);

Effect.runPromise(program);
