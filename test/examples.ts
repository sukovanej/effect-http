import * as Schema from "@effect/schema/Schema"
import { Api, Representation } from "effect-http"

// Example GET

export const exampleApiGet = Api.api().pipe(
  Api.get("getValue", "/get-value", { response: Schema.number })
)

// Example GET, string response

export const exampleApiGetStringResponse = Api.api().pipe(
  Api.get("hello", "/hello", { response: Schema.number })
)

// Example POST, nullable body field

const ExampleSchemaNullableField = Schema.struct({
  value: Schema.optionFromNullable(Schema.string)
})

export const exampleApiPostNullableField = Api.api().pipe(
  Api.post("test", "/test", {
    response: ExampleSchemaNullableField
  })
)

// Example GET, query parameter

export const exampleApiGetQueryParameter = Api.api().pipe(
  Api.get("hello", "/hello", {
    request: {
      query: Schema.struct({
        country: Schema.string.pipe(Schema.pattern(/^[A-Z]{2}$/))
      })
    },
    response: Schema.string
  })
)

// Example GET, headers

const _ExampleResponse = Schema.struct({ clientIdHash: Schema.string })
interface ExampleResponseFrom extends Schema.Schema.From<typeof _ExampleResponse> {}
interface ExampleResponse extends Schema.Schema.To<typeof _ExampleResponse> {}
const ExampleResponse: Schema.Schema<ExampleResponse, ExampleResponseFrom> = _ExampleResponse

export const exampleApiGetHeaders = Api.api().pipe(
  Api.get("hello", "/hello", {
    response: ExampleResponse,
    request: {
      headers: Schema.struct({ "X-Client-Id": Schema.string })
    }
  })
)

// Example GET, custom response with headers

export const exampleApiGetCustomResponseWithHeaders = Api.api().pipe(
  Api.get("hello", "/hello", {
    response: {
      status: 201,
      content: Schema.struct({ value: Schema.string }),
      headers: Schema.struct({
        "My-Header": Schema.literal("hello")
      })
    }
  })
)

// Example GET, option response field

const ExampleSchemaOptionalField = Schema.struct({
  foo: Schema.optional(Schema.string, { as: "Option", exact: true })
})

export const exampleApiGetOptionalField = Api.api().pipe(
  Api.get("hello", "/hello", {
    response: ExampleSchemaOptionalField,
    request: {
      query: Schema.struct({
        value: Schema.literal("on", "off")
      })
    }
  })
)

// Example Post, request body

export const exampleApiRequestBody = Api.api().pipe(
  Api.post("hello", "/hello", {
    response: Schema.string,
    request: {
      body: Schema.struct({
        foo: Schema.string
      })
    }
  })
)

// Example Post, request headers

export const exampleApiRequestHeaders = Api.api().pipe(
  Api.post("hello", "/hello", {
    response: Schema.string,
    request: {
      headers: Schema.struct({
        "X-HEADER": Schema.literal("a", "b")
      })
    }
  })
)

// Example Post, path headers

export const exampleApiParams = Api.api().pipe(
  Api.post("hello", "/hello/:value", {
    response: Schema.string,
    request: {
      params: Schema.struct({
        value: Schema.literal("a", "b")
      })
    }
  })
)

// Example PUT

export const exampleApiPutResponse = Api.api().pipe(
  Api.put("myOperation", "/my-operation", { response: Schema.string })
)

// Example POST, multiple responses
export const exampleApiMultipleResponses = Api.api().pipe(
  Api.post("hello", "/hello", {
    response: [
      {
        status: 201,
        content: Schema.number
      },
      {
        status: 200,
        content: Schema.number,
        headers: Schema.struct({
          "X-Another-200": Schema.NumberFromString
        })
      },
      {
        status: 204,
        headers: Schema.struct({ "X-Another": Schema.NumberFromString })
      }
    ],
    request: {
      query: Schema.struct({
        value: Schema.NumberFromString
      })
    }
  })
)

// Example POST, all request locations optional

export const exampleApiOptional = Api.api().pipe(
  Api.post("hello", "/hello/:value/another/:another?", {
    response: Schema.struct({
      query: Schema.struct({
        value: Schema.number,
        another: Schema.optional(Schema.string, { exact: true })
      }),
      params: Schema.struct({
        value: Schema.number,
        another: Schema.optional(Schema.string, { exact: true })
      }),
      headers: Schema.struct({
        value: Schema.number,
        another: Schema.optional(Schema.string, { exact: true }),
        hello: Schema.optional(Schema.string, { exact: true })
      })
    }),
    request: {
      query: Schema.struct({
        value: Schema.NumberFromString,
        another: Schema.optional(Schema.string, { exact: true })
      }),
      params: Schema.struct({
        value: Schema.NumberFromString,
        another: Schema.optional(Schema.string, { exact: true })
      }),
      headers: Schema.struct({
        value: Schema.NumberFromString,
        another: Schema.optional(Schema.string, { exact: true }),
        hello: Schema.optional(Schema.string, { exact: true })
      })
    }
  })
)

// Example POST, optional params

export const exampleApiOptionalParams = Api.api().pipe(
  Api.post("hello", "/hello/:value/another/:another?", {
    response: Schema.struct({
      params: Schema.struct({
        value: Schema.number,
        another: Schema.optional(Schema.string, { exact: true })
      })
    }),
    request: {
      params: Schema.struct({
        value: Schema.NumberFromString,
        another: Schema.optional(Schema.string, { exact: true })
      })
    }
  })
)

// Example POSTs, full response

export const exampleApiFullResponse = Api.api().pipe(
  Api.post("hello", "/hello", {
    response: {
      status: 200,
      content: Schema.number,
      headers: Schema.struct({
        "My-Header": Schema.string
      })
    }
  }),
  Api.post("another", "/another", {
    response: {
      status: 200,
      content: Schema.number
    }
  })
)

export const exampleApiMultipleQueryValues = Api.api().pipe(
  Api.post("test", "/test", {
    response: Schema.string,
    request: {
      query: Schema.struct({
        value: Schema.literal("x", "y"),
        another: Schema.string
      })
    }
  })
)

export const exampleApiRepresentations = Api.api().pipe(
  Api.post("test", "/test", {
    response: {
      content: Schema.string,
      status: 200,
      representations: [Representation.plainText, Representation.json]
    }
  })
)
