import type { Scope } from "effect"
import { Effect, Logger, LogLevel, pipe } from "effect"
import { assert } from "vitest"

const setLogger = Logger.replace(Logger.defaultLogger, Logger.none)
// import { PrettyLogger } from "effect-log";
// const setLogger = PrettyLogger.layer();

export const runTestEffect = <E, A>(self: Effect.Effect<A, E, Scope.Scope>) =>
  pipe(
    self,
    Effect.provide(setLogger),
    Logger.withMinimumLogLevel(LogLevel.All),
    Effect.scoped,
    Effect.match({
      onFailure: (e) => assert.fail(e instanceof Error ? e.message : String(e)),
      onSuccess: (a) => a
    }),
    Effect.runPromise
  )
