import type { Scope } from "effect"
import { Effect, Logger, LogLevel, pipe } from "effect"

export const runTestEffect = <E, A>(self: Effect.Effect<A, E, Scope.Scope>) =>
  pipe(
    self,
    Effect.provide(Logger.remove(Logger.defaultLogger)),
    Logger.withMinimumLogLevel(LogLevel.All),
    Effect.timeout(1000),
    Effect.scoped,
    Effect.runPromise
  )
