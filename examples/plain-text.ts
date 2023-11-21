import { runMain } from "@effect/platform-node/Runtime";
import { Effect } from "effect";
import {
  Api,
  HttpSchema,
  Middlewares,
  NodeServer,
  RouterBuilder,
} from "effect-http";
import { PrettyLogger } from "effect-log";

export const api = Api.api({ title: "Example API" }).pipe(
  Api.get("root", "/", {
    response: HttpSchema.PlainText,
  }),
);

export const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("root", () => Effect.succeed("Hello World!")),
  RouterBuilder.build,
  Middlewares.errorLog,
);

const program = app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(PrettyLogger.layer()),
);

runMain(program);
