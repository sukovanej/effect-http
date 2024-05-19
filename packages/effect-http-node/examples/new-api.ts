import { Schema } from "@effect/schema"
import { pipe } from "effect"
import { Api, ApiGroup, ApiResponse, Security } from "effect-http"

interface MyRequirement {}
interface AnotherDep {}

const schema1: Schema.Schema<number, string, MyRequirement> = Schema.NumberFromString
const schema2: Schema.Schema<number, string, AnotherDep> = Schema.NumberFromString

class MyRequest extends Schema.Class<MyRequest>("Schema1")({
  name: schema1
}) {}

class TestPathParams extends Schema.Class<TestPathParams>("TestPathParams")({
  path: schema2
}) {}

const group1 = pipe(
  ApiGroup.make("my group"),
  ApiGroup.addEndpoint(
    pipe(
      ApiGroup.get("groupTest", "/test", { description: "test description" }),
      ApiGroup.setRequestBody(MyRequest),
      ApiGroup.setRequestPath(TestPathParams)
    )
  )
)

const test = pipe(
  Api.get("test", "/test"),
  Api.setRequestBody(MyRequest),
  Api.setRequestPath(TestPathParams),
  Api.setSecurity(
    Security.bearer({ name: "mySecurity", description: "test" })
  ),
  Api.setResponseBody(MyRequest),
  Api.addResponse(ApiResponse.make(201, TestPathParams, MyRequest))
)

export const api = pipe(
  Api.make({ title: "my api" }),
  Api.addEndpoint(test),
  Api.addEndpoint(
    pipe(
      Api.get("another", "/hello-there"),
      Api.setRequestBody(MyRequest),
      Api.setRequestPath(TestPathParams)
    )
  ),
  Api.addGroup(group1)
)
