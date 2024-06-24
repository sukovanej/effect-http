import { Schema } from "@effect/schema";
import { pipe } from "effect";
import * as Api from "./Api.js";
import { CliConfig } from "./CliConfig.js";

const api = pipe(
  Api.make({ title: "Users API" }),
  Api.addEndpoint(
    Api.get("getUser", "/user").pipe(
      Api.setResponseBody(Schema.Number),
    )
  )
)

export default new CliConfig({
    api,
})
