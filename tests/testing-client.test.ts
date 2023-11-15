import { HttpServer } from "@effect/platform";
import { FileSystem, NodeContext } from "@effect/platform-node";
import * as Router from "@effect/platform/Http/Router";
import { Schema } from "@effect/schema";
import { Context, Effect, Predicate, pipe } from "effect";
import { Api, RouterBuilder, ServerError, Testing } from "effect-http";
import { HttpClientError } from "effect-http/ClientError";

import { runTestEffect } from "./utils";

test("testing query", async () => {
  const api = pipe(
    Api.api(),
    Api.get("hello", "/hello", {
      response: Schema.string,
      request: {
        query: Schema.struct({ input: Schema.NumberFromString }),
      },
    }),
  );

  const app = pipe(
    RouterBuilder.make(api),
    RouterBuilder.handle("hello", ({ query }) =>
      Effect.succeed(`${query.input + 1}`),
    ),
    RouterBuilder.build,
  );

  const response = await pipe(
    Testing.make(app, api),
    Effect.flatMap((client) => client.hello({ query: { input: 12 } })),
    runTestEffect,
  );

  expect(response).toEqual("13");
});

test("testing failure", async () => {
  const api = pipe(
    Api.api(),
    Api.get("hello", "/hello", {
      response: Schema.string,
    }),
  );

  const app = pipe(
    RouterBuilder.make(api),
    RouterBuilder.handle("hello", () =>
      Effect.fail(ServerError.notFoundError("oh oh")),
    ),
    RouterBuilder.build,
  );

  const response = await pipe(
    Testing.make(app, api),
    Effect.flatMap((client) => client.hello()),
    Effect.flip,
    runTestEffect,
  );

  expect(response).toEqual(HttpClientError.create("oh oh", 404));
});

test("testing with dependencies", async () => {
  const api = pipe(
    Api.api(),
    Api.get("hello", "/hello", {
      response: Schema.string,
      request: {
        query: Schema.struct({ input: Schema.NumberFromString }),
      },
    }),
  );

  const MyService = Context.Tag<number>();

  const app = pipe(
    RouterBuilder.make(api),
    RouterBuilder.handle("hello", ({ query }) =>
      Effect.map(MyService, (v) => `${query.input + v}`),
    ),
    RouterBuilder.mapRouter(Router.provideService(MyService, 2)),
    RouterBuilder.build,
  );

  const response = await pipe(
    Testing.make(app, api),
    Effect.flatMap((client) => client.hello({ query: { input: 12 } })),
    Effect.provideService(MyService, 2),
    runTestEffect,
  );

  expect(response).toEqual("14");
});

test("testing params", async () => {
  const api = pipe(
    Api.api(),
    Api.get("hello", "/hello/:input", {
      response: Schema.string,
      request: {
        params: Schema.struct({ input: Schema.NumberFromString }),
      },
    }),
  );

  const app = pipe(
    RouterBuilder.make(api),
    RouterBuilder.handle("hello", ({ params }) =>
      Effect.succeed(`${params.input + 1}`),
    ),
    RouterBuilder.build,
  );

  const response = await pipe(
    Testing.make(app, api),
    Effect.flatMap((client) => client.hello({ params: { input: 12 } })),
    runTestEffect,
  );

  expect(response).toEqual("13");
});

test("testing multiple responses", async () => {
  const api = pipe(
    Api.api(),
    Api.get("hello", "/hello", {
      response: [
        {
          content: Schema.number,
          status: 200,
        },
        {
          status: 201,
        },
      ],
      request: {
        query: Schema.struct({ input: Schema.NumberFromString }),
      },
    }),
  );

  const app = pipe(
    RouterBuilder.make(api),
    RouterBuilder.handle("hello", ({ query }) =>
      Effect.succeed(
        query.input === 1
          ? { content: 69, status: 200 as const }
          : { status: 201 as const },
      ),
    ),
    RouterBuilder.build,
  );

  const [response1, response2] = await pipe(
    Testing.make(app, api),
    Effect.flatMap((client) =>
      Effect.all([
        client.hello({ query: { input: 1 } }),
        client.hello({ query: { input: 2 } }),
      ] as const),
    ),
    runTestEffect,
  );

  expect(response1).toMatchObject({ content: 69, status: 200 });
  expect(response2).toMatchObject({ status: 201 });
});

test("testing body", async () => {
  const api = pipe(
    Api.api(),
    Api.post("hello", "/hello", {
      response: Schema.string,
      request: {
        body: Schema.struct({ input: Schema.NumberFromString }),
      },
    }),
  );

  const app = pipe(
    RouterBuilder.make(api),
    RouterBuilder.handle("hello", ({ body }) =>
      Effect.succeed(`${body.input + 1}`),
    ),
    RouterBuilder.build,
  );

  const response = await pipe(
    Testing.make(app, api),
    Effect.flatMap((client) => client.hello({ body: { input: 12 } })),
    runTestEffect,
  );

  expect(response).toEqual("13");
});

test("form data", async () => {
  const api = pipe(
    Api.api(),
    Api.post("upload", "/upload", {
      request: {
        body: Api.FormData,
      },
      response: Schema.string,
    }),
  );

  const app = pipe(
    RouterBuilder.make(api),
    RouterBuilder.handle("upload", () =>
      Effect.gen(function* (_) {
        const request = yield* _(HttpServer.request.ServerRequest);
        const body = yield* _(request.formData);
        const file = body["file"];

        if (file === null) {
          return yield* _(ServerError.badRequest('Expected "file"'));
        }

        if (Predicate.isString(file)) {
          return yield* _(ServerError.badRequest("Expected file"));
        }

        const fs = yield* _(FileSystem.FileSystem);

        return yield* _(fs.readFileString(file[0].path));
      }),
    ),
    RouterBuilder.build,
  );

  const formData = new FormData();
  formData.append("file", new Blob(["my file content"]));

  const response = await pipe(
    Testing.make(app, api),
    Effect.flatMap((client) => client.upload({ body: formData })),
    Effect.provide(NodeContext.layer),
    runTestEffect,
  );

  expect(response).toEqual("my file content");
});
