import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import { Api, NodeServer, RouterBuilder } from "effect-http";

const api = pipe(
  Api.api(),
  Api.get("stuff", "/stuff", { response: Schema.string }),
);

const server = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("stuff", () => Effect.succeed("stuff")),
  RouterBuilder.build,
);

// TODO
//const myValidationErrorFormatter: ValidationErrorFormatter = (error) =>
//  JSON.stringify(error);

pipe(
  server,
  NodeServer.listen({ port: 3000 }),
  // TODO
  // Effect.provide(Http.setValidationErrorFormatter(myValidationErrorFormatter)),
  Effect.runPromise,
);
