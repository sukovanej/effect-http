import { runMain } from "@effect/platform-node/Runtime"
import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { Api, ExampleServer, NodeServer, RouterBuilder } from "effect-http"

import { debugLogger } from "./_utils.js"

const responseSchema = Schema.struct({ name: Schema.string })

const testApi = Api.apiGroup("test").pipe(
  Api.get("test", "/test", { response: responseSchema })
)

const userApi = Api.apiGroup("Users").pipe(
  Api.get("getUser", "/user", { response: responseSchema }),
  Api.post("storeUser", "/user", { response: responseSchema }),
  Api.put("updateUser", "/user", { response: responseSchema }),
  Api.delete("deleteUser", "/user", { response: responseSchema })
)

const categoriesApi = Api.apiGroup("Categories").pipe(
  Api.get("getCategory", "/category", { response: responseSchema }),
  Api.post("storeCategory", "/category", { response: responseSchema }),
  Api.put("updateCategory", "/category", { response: responseSchema }),
  Api.delete("deleteCategory", "/category", { response: responseSchema })
)

const api = Api.api().pipe(
  Api.addGroup(testApi),
  Api.addGroup(userApi),
  Api.addGroup(categoriesApi)
)

ExampleServer.make(api).pipe(
  RouterBuilder.build,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  runMain
)
