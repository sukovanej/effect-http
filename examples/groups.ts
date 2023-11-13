import { runMain } from "@effect/platform-node/Runtime";
import { Schema } from "@effect/schema";
import { Effect, Fiber, LogLevel, Logger, Schedule, pipe } from "effect";
import { Api, ExampleServer, NodeServer, RouterBuilder } from "effect-http";
import { Log } from "effect-log";

const responseSchema = Schema.struct({ name: Schema.string });

const testApi = pipe(
  Api.apiGroup("test"),
  Api.get("test", "/test", { response: responseSchema }),
);

const userApi = pipe(
  Api.apiGroup("Users"),
  Api.get("getUser", "/user", { response: responseSchema }),
  Api.post("storeUser", "/user", { response: responseSchema }),
  Api.put("updateUser", "/user", { response: responseSchema }),
  Api.delete("deleteUser", "/user", { response: responseSchema }),
);

const categoriesApi = pipe(
  Api.apiGroup("Categories"),
  Api.get("getCategory", "/category", { response: responseSchema }),
  Api.post("storeCategory", "/category", { response: responseSchema }),
  Api.put("updateCategory", "/category", { response: responseSchema }),
  Api.delete("deleteCategory", "/category", { response: responseSchema }),
);

const api = pipe(
  Api.api(),
  Api.addGroup(testApi),
  Api.addGroup(userApi),
  Api.addGroup(categoriesApi),
);

const program = Effect.gen(function* (_) {
  const server = yield* _(
    ExampleServer.make(api),
    RouterBuilder.build,
    NodeServer.listen({ port: 3000 }),
    Effect.fork,
  );

  const fiberChecker = yield* _(
    Fiber.roots,
    Effect.flatMap((fibers) => Effect.log(`I see ${fibers.length} fibers`)),
    Effect.schedule(
      Schedule.zipLeft(Schedule.repeatForever, Schedule.linear(1000)),
    ),
    Effect.forkDaemon,
  );

  yield* _(Fiber.joinAll([server, fiberChecker]));
});

pipe(
  program,
  Effect.tapErrorCause(Effect.logError),
  Logger.withMinimumLogLevel(LogLevel.All),
  Effect.provide(Log.setPrettyLogger()),
  runMain,
);
