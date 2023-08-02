import * as Schema from "@effect/schema/Schema";
import { Context, Effect, pipe } from "effect";
import * as Http from "effect-http";

const api = pipe(
  Http.api({ title: "Users API" }),
  Http.post("storeUser", "/users", {
    response: Schema.string,
    request: {
      body: Schema.struct({ name: Schema.string }),
    },
  }),
);

type Api = typeof api;

interface UserRepository {
  existsByName: (name: string) => Effect.Effect<never, never, boolean>;
  store: (user: string) => Effect.Effect<never, never, void>;
}

const UserRepository = Context.Tag<UserRepository>();

const mockUserRepository = UserRepository.of({
  existsByName: () => Effect.succeed(true),
  store: () => Effect.unit,
});

const handleStoreUser = ({ body }: Http.Input<Api, "storeUser">) =>
  pipe(
    Effect.flatMap(UserRepository, (userRepository) =>
      userRepository.existsByName(body.name),
    ),
    Effect.filterOrFail(
      (alreadyExists) => !alreadyExists,
      () => Http.conflictError(`User "${body.name}" already exists.`),
    ),
    Effect.flatMap(() =>
      Effect.flatMap(UserRepository, (repository) =>
        repository.store(body.name),
      ),
    ),
    Effect.map(() => `User "${body.name}" stored.`),
  );

const server = pipe(
  api,
  Http.server,
  Http.handle("storeUser", handleStoreUser),
  Http.exhaustive,
);

pipe(
  server,
  Http.listen({ port: 3000 }),
  Effect.provideService(UserRepository, mockUserRepository),
  Effect.runPromise,
);
