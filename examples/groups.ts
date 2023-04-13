import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import * as Http from "../src";

const responseSchema = S.struct({ name: S.string });

const api = pipe(
  Http.api({ groupName: "Test" }),
  Http.get("test", "/test", { response: responseSchema }),
  Http.group("Users"),
  Http.get("getUser", "/user", { response: responseSchema }),
  Http.post("storeUser", "/user", { response: responseSchema }),
  Http.put("updateUser", "/user", { response: responseSchema }),
  Http.delete("deleteUser", "/user", { response: responseSchema }),
  Http.group("Categories"),
  Http.get("getCategory", "/category", { response: responseSchema }),
  Http.post("storeCategory", "/category", { response: responseSchema }),
  Http.put("updateCategory", "/category", { response: responseSchema }),
  Http.delete("deleteCategory", "/category", { response: responseSchema }),
);

pipe(
  api,
  Http.exampleServer,
  Http.listen(3000),
  Effect.flatMap(({ port }) => Effect.log(`Listening on ${port}`)),
  Effect.runPromise,
);
