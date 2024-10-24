/* eslint-disable @typescript-eslint/no-empty-object-type */
import { Api, ApiResponse, ApiSchema, Representation } from "effect-http"
import * as Schema from "effect/Schema"

// Example GET

export const exampleApiGet = Api.make().pipe(
  Api.addEndpoint(
    Api.get("getValue", "/get-value").pipe(
      Api.setResponseBody(Schema.Number)
    )
  )
)

// Example POST, nullable body field

const ExampleSchemaNullableField = Schema.Struct({
  value: Schema.OptionFromNullOr(Schema.String)
})

export const exampleApiPostNullableField = Api.make().pipe(
  Api.addEndpoint(
    Api.post("test", "/test").pipe(
      Api.setResponseBody(ExampleSchemaNullableField)
    )
  )
)

// Example GET, query parameter

export const exampleApiGetQueryParameter = Api.make().pipe(
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(
      Api.setRequestQuery(Schema.Struct({
        country: Schema.String.pipe(
          Schema.pattern(/^[A-Z]{2}$/),
          Schema.annotations({ message: () => "Must be a valid country code" })
        )
      })),
      Api.setResponseBody(Schema.String)
    )
  )
)

// Example GET, headers

const _ExampleResponse = Schema.Struct({ clientIdHash: Schema.String })
interface ExampleResponseFrom extends Schema.Schema.Encoded<typeof _ExampleResponse> {}
interface ExampleResponse extends Schema.Schema.Type<typeof _ExampleResponse> {}
const ExampleResponse: Schema.Schema<ExampleResponse, ExampleResponseFrom> = _ExampleResponse

export const exampleApiGetHeaders = Api.make().pipe(
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(
      Api.setResponseBody(ExampleResponse),
      Api.setRequestHeaders(Schema.Struct({ "x-client-id": Schema.String }))
    )
  )
)

// Example GET, custom response with headers

export const exampleApiGetCustomResponseWithHeaders = Api.make().pipe(
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(
      Api.setResponseStatus(201),
      Api.setResponseBody(Schema.Struct({ value: Schema.String })),
      Api.setResponseHeaders(Schema.Struct({
        "my-header": Schema.Literal("hello")
      }))
    )
  )
)

// Example GET, option response field

const ExampleSchemaOptionalField = Schema.Struct({
  foo: Schema.optionalWith(Schema.String, { as: "Option", exact: true })
})

export const exampleApiGetOptionalField = Api.make().pipe(
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(
      Api.setRequestQuery(Schema.Struct({ value: Schema.Literal("on", "off") })),
      Api.setResponseBody(ExampleSchemaOptionalField)
    )
  )
)

// Example Post, request body

export const exampleApiRequestBody = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello").pipe(
      Api.setRequestBody(Schema.Struct({
        foo: Schema.String
      })),
      Api.setResponseBody(Schema.String)
    )
  )
)

// Example Post, request headers

export const exampleApiRequestHeaders = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello").pipe(
      Api.setRequestHeaders(Schema.Struct({
        "x-header": Schema.Literal("a", "b")
      })),
      Api.setResponseBody(Schema.String)
    )
  )
)

// Example Post, path headers

export const exampleApiParams = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello/:value").pipe(
      Api.setResponseBody(Schema.String),
      Api.setRequestPath(Schema.Struct({
        value: Schema.Literal("a", "b")
      }))
    )
  )
)

// Example PUT

export const exampleApiPutResponse = Api.make().pipe(
  Api.addEndpoint(
    Api.put("myOperation", "/my-operation").pipe(
      Api.setResponseBody(Schema.String)
    )
  )
)

// Example POST, multiple responses
export const exampleApiMultipleResponses = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello").pipe(
      Api.setRequestQuery(Schema.Struct({ value: Schema.NumberFromString })),
      Api.setResponseStatus(201),
      Api.setResponseBody(Schema.Number),
      Api.addResponse(ApiResponse.make(
        200,
        Schema.Number,
        Schema.Struct({
          "x-another-200": Schema.NumberFromString
        })
      )),
      Api.addResponse(ApiResponse.make(204, ApiSchema.Ignored, Schema.Struct({ "x-another": Schema.NumberFromString })))
    )
  )
)

// Example POST, all request locations optional

export const exampleApiOptional = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello/:value/another/:another?").pipe(
      Api.setRequestQuery(Schema.Struct({
        value: Schema.NumberFromString,
        another: Schema.optionalWith(Schema.String, { exact: true })
      })),
      Api.setRequestPath(Schema.Struct({
        value: Schema.NumberFromString,
        another: Schema.optionalWith(Schema.String, { exact: true })
      })),
      Api.setRequestHeaders(Schema.Struct({
        value: Schema.NumberFromString,
        another: Schema.optionalWith(Schema.String, { exact: true }),
        hello: Schema.optionalWith(Schema.String, { exact: true })
      })),
      Api.setResponseBody(Schema.Struct({
        query: Schema.Struct({
          value: Schema.Number,
          another: Schema.optionalWith(Schema.String, { exact: true })
        }),
        path: Schema.Struct({
          value: Schema.Number,
          another: Schema.optionalWith(Schema.String, { exact: true })
        }),
        headers: Schema.Struct({
          value: Schema.Number,
          another: Schema.optionalWith(Schema.String, { exact: true }),
          hello: Schema.optionalWith(Schema.String, { exact: true })
        })
      }))
    )
  )
)

// Example POST, optional params

export const exampleApiOptionalParams = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello/:value/another/:another?").pipe(
      Api.setRequestPath(Schema.Struct({
        value: Schema.NumberFromString,
        another: Schema.optionalWith(Schema.String, { exact: true })
      })),
      Api.setResponseBody(Schema.Struct({
        path: Schema.Struct({
          value: Schema.Number,
          another: Schema.optionalWith(Schema.String, { exact: true })
        })
      }))
    )
  )
)

// Example POSTs, full response

export const exampleApiFullResponse = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello").pipe(
      Api.setResponseBody(Schema.Number),
      Api.setResponseHeaders(Schema.Struct({ "my-header": Schema.String }))
    )
  ),
  Api.addEndpoint(
    Api.post("another", "/another").pipe(
      Api.setResponseBody(Schema.Number)
    )
  )
)

export const exampleApiMultipleQueryValues = Api.make().pipe(
  Api.addEndpoint(
    Api.post("test", "/test").pipe(
      Api.setRequestQuery(Schema.Struct({ value: Schema.Literal("x", "y"), another: Schema.String })),
      Api.setResponseBody(Schema.String)
    )
  )
)

export const exampleApiRepresentations = Api.make().pipe(
  Api.addEndpoint(
    Api.post("test", "/test").pipe(
      Api.setResponseStatus(200),
      Api.setResponseBody(Schema.String),
      Api.setResponseRepresentations([Representation.plainText, Representation.json])
    )
  )
)

export const exampleApiEmptyResponse = Api.make().pipe(
  Api.addEndpoint(
    Api.post("test", "/test").pipe(Api.setRequestBody(Schema.String))
  )
)
