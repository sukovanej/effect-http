import { Schema } from "@effect/schema"
import { Api, ApiGroup } from "effect-http"
import { identity, pipe } from "effect/Function"
import { expect, test } from "vitest"
import { simpleApi1 } from "./example-apis.js"

test("fillDefaultSchemas", () => {
  expect(simpleApi1.groups).toHaveLength(1)
  expect(simpleApi1.groups.flatMap((group) => group.endpoints)).toHaveLength(1)
})

test("Attempt to declare duplicate operation id should fail as a safe guard", () => {
  const api = pipe(
    Api.make(),
    Api.addEndpoint(Api.put("myOperation", "/my-operation"))
  )

  expect(() =>
    pipe(
      api,
      Api.addEndpoint(Api.post("myOperation", "/my-operation"))
    )
  ).toThrowError()

  const apiGroup = pipe(
    ApiGroup.make("group"),
    ApiGroup.addEndpoint(Api.patch("myOperation", "/my-operation"))
  )

  expect(() =>
    pipe(
      apiGroup,
      ApiGroup.addEndpoint(ApiGroup.patch("myOperation", "/my-operation"))
    )
  ).toThrowError()

  expect(() => pipe(api, Api.addGroup(apiGroup))).toThrowError()
})

test.each(
  [
    {
      expectFailure: false,
      path: "/hello",
      schema: undefined
    },
    {
      expectFailure: false,
      path: "/hello/:input",
      schema: Schema.struct({ input: Schema.string })
    },
    {
      expectFailure: true,
      path: "/hello/:input?",
      schema: Schema.struct({ input: Schema.string })
    },
    {
      expectFailure: true,
      path: "/hello",
      schema: Schema.struct({ input: Schema.string })
    },
    {
      expectFailure: true,
      path: "/hello/:input",
      schema: undefined
    },
    {
      expectFailure: false,
      path: "/hello/:input/another/:another",
      schema: Schema.struct({ input: Schema.string, another: Schema.string })
    },
    {
      expectFailure: true,
      path: "/hello/:input/another/:another?",
      schema: Schema.struct({ input: Schema.string, another: Schema.string })
    },
    {
      expectFailure: false,
      path: "/hello/:input/another/:another?",
      schema: Schema.struct({
        input: Schema.string,
        another: Schema.optional(Schema.string)
      })
    }
  ] as const
)(
  "Api path must match param schemas (%#)",
  ({ expectFailure, path, schema }) => {
    const createApi = () =>
      pipe(
        Api.make(),
        Api.addEndpoint(
          Api.get("hello", path).pipe(
            schema && Api.setRequestPath(schema as Schema.Schema<any, any, never>) || identity
          )
        )
      )

    if (expectFailure) {
      expect(createApi).toThrowError()
    } else {
      createApi()
    }
  }
)
