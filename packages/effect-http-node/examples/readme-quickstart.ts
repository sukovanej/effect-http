import { NodeRuntime } from "@effect/platform-node"
import { Effect, pipe, Schema } from "effect"
import { Api, Client, Handler, QuerySchema, RouterBuilder } from "effect-http"
import { NodeServer } from "effect-http-node"

const UserResponse = Schema.Struct({
  name: Schema.String,
  id: Schema.Int.pipe(Schema.positive())
})
const GetUserQuery = Schema.Struct({ id: QuerySchema.Number })

const getUserEndpoint = Api.get("getUser", "/user").pipe(
  Api.setResponseBody(UserResponse),
  Api.setRequestQuery(GetUserQuery)
)

const getUserHandler = Handler.make(
  getUserEndpoint,
  ({ query }) => Effect.succeed({ name: "milan", id: query.id })
)

const api = Api.make({ title: "Users API" }).pipe(
  Api.addEndpoint(getUserEndpoint)
)

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle(getUserHandler),
  RouterBuilder.build
)

app.pipe(NodeServer.listen({ port: 3000 }), NodeRuntime.runMain)

// Another file

const client = Client.make(api, { baseUrl: "http://localhost:3000" })

const program = pipe(
  client.getUser({ query: { id: 12 } }),
  Effect.flatMap((user) => Effect.log(`Got ${user.name}, nice!`))
)

Effect.runFork(program)
