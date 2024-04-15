import { Schema } from "@effect/schema"
import { Api, ApiGroup } from "effect-http"
import { identity, pipe } from "effect/Function"
import { expect, test } from "vitest"

export const simpleApi1 = pipe(
  Api.make(),
  Api.addEndpoint(
    Api.get("myOperation", "/get").pipe(
      Api.setResponseBody(Schema.String)
    )
  )
)

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
      schema: Schema.Struct({ input: Schema.String })
    },
    {
      expectFailure: true,
      path: "/hello/:input?",
      schema: Schema.Struct({ input: Schema.String })
    },
    {
      expectFailure: true,
      path: "/hello",
      schema: Schema.Struct({ input: Schema.String })
    },
    {
      expectFailure: true,
      path: "/hello/:input",
      schema: undefined
    },
    {
      expectFailure: false,
      path: "/hello/:input/another/:another",
      schema: Schema.Struct({ input: Schema.String, another: Schema.String })
    },
    {
      expectFailure: true,
      path: "/hello/:input/another/:another?",
      schema: Schema.Struct({ input: Schema.String, another: Schema.String })
    },
    {
      expectFailure: false,
      path: "/hello/:input/another/:another?",
      schema: Schema.Struct({
        input: Schema.String,
        another: Schema.optional(Schema.String)
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
