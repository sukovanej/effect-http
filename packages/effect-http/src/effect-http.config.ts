import { Schema } from "@effect/schema";
import { pipe } from "effect";
import * as Api from "./Api.js";
import * as CliConfig from "./CliConfig.js";

const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(
    Api.get("getUser", "/user", { "description": "Get a user by their id" }).pipe(
      Api.setResponseBody(Schema.Number),
    )
  )
)

export default CliConfig.make({
    api,
    client: {
      baseUrl: "http://localhost:3000"
    }
})
