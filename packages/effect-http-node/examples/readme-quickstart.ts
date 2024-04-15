import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { Api, Client, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

const UserResponse = Schema.Struct({
  name: Schema.String,
  id: pipe(Schema.Number, Schema.int(), Schema.positive())
})
const GetUserQuery = Schema.Struct({ id: Schema.NumberFromString })

const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(
    pipe(
      Api.get("getUser", "/user"),
      Api.setResponseBody(UserResponse),
      Api.setRequestQuery(GetUserQuery)
    )
  )
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("getUser", ({ query }) => Effect.succeed({ name: "milan", id: query.id })),
  RouterBuilder.build
)

app.pipe(NodeServer.listen({ port: 3000 }), NodeRuntime.runMain)

// Another file

const client = Client.make(api, { baseUrl: "http://localhost:3000" })

const program = pipe(
  client.getUser({ query: { id: 12 } }),
  Effect.flatMap((user) => Effect.log(`Got ${user.name}, nice!`)),
  Effect.scoped
)

Effect.runPromise(program)
