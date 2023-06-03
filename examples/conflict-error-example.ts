import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

const api = pipe(
  Http.api({ title: "Users API" }),
  Http.post("storeUser", "/users", {
    response: Schema.string,
    body: Schema.struct({ name: Schema.string }),
  }),
);

interface UserRepository {
  existsByName: (name: string) => Effect.Effect<never, never, boolean>;
  store: (user: string) => Effect.Effect<never, never, void>;
}

const UserRepositoryService = Context.Tag<UserRepository>();

const mockUserRepository = {
  existsByName: () => Effect.succeed(true),
  store: () => Effect.unit(),
} satisfies UserRepository;

const handleStoreUser = ({ body }: Http.Input<typeof api, "storeUser">) =>
  pipe(
    Effect.flatMap(UserRepositoryService, (userRepository) =>
      userRepository.existsByName(body.name),
    ),
    Effect.filterOrFail(
      (alreadyExists) => !alreadyExists,
      () => Http.conflictError(`User "${body.name}" already exists.`),
    ),
    Effect.flatMap(() =>
      Effect.flatMap(UserRepositoryService, (repository) =>
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
  Effect.provideService(UserRepositoryService, mockUserRepository),
  Effect.runPromise,
);
