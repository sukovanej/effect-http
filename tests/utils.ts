import { Effect, LogLevel, Logger, Scope, pipe } from "effect";

const setLogger = Logger.replace(Logger.defaultLogger, Logger.none);
//import { Log } from "effect-log";
//const setLogger = Log.setPrettyLogger();

export const runTestEffect = <E, A>(self: Effect.Effect<Scope.Scope, E, A>) =>
  pipe(
    self,
    Effect.provide(setLogger),
    Logger.withMinimumLogLevel(LogLevel.All),
    Effect.scoped,
    Effect.runPromise,
  );
