import * as Schema from "@effect/schema/Schema"
import { pipe } from "effect"
import { Api, ApiResponse, ApiSchema, Representation, Security } from "effect-http"

// Example GET

export const exampleApiGet = pipe(
  Api.make(),
  Api.addEndpoint(
    pipe(
      Api.get("getValue", "/get-value"),
      Api.setResponseBody(Schema.number)
    )
  )
)

// Example GET, string response

export const exampleApiGetStringResponse = Api.make().pipe(
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(Api.setResponseBody(Schema.number))
  )
)

// Example POST, nullable body field

const ExampleSchemaNullableField = Schema.struct({
  value: Schema.optionFromNullable(Schema.string)
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
      Api.setRequestQuery(Schema.struct({ country: Schema.string.pipe(Schema.pattern(/^[A-Z]{2}$/)) })),
      Api.setResponseBody(Schema.string)
    )
  )
)

// Example GET, headers

const _ExampleResponse = Schema.struct({ clientIdHash: Schema.string })
interface ExampleResponseFrom extends Schema.Schema.Encoded<typeof _ExampleResponse> {}
interface ExampleResponse extends Schema.Schema.Type<typeof _ExampleResponse> {}
const ExampleResponse: Schema.Schema<ExampleResponse, ExampleResponseFrom> = _ExampleResponse

export const exampleApiGetHeaders = Api.make().pipe(
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(
      Api.setResponseBody(ExampleResponse),
      Api.setRequestHeaders(Schema.struct({ "X-Client-Id": Schema.string }))
    )
  )
)

// Example GET, custom response with headers

export const exampleApiGetCustomResponseWithHeaders = Api.make().pipe(
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(
      Api.setResponseStatus(201),
      Api.setResponseBody(Schema.struct({ value: Schema.string })),
      Api.setResponseHeaders(Schema.struct({
        "My-Header": Schema.literal("hello")
      }))
    )
  )
)

// Example GET, option response field

const ExampleSchemaOptionalField = Schema.struct({
  foo: Schema.optional(Schema.string, { as: "Option", exact: true })
})

export const exampleApiGetOptionalField = Api.make().pipe(
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(
      Api.setRequestQuery(Schema.struct({ value: Schema.literal("on", "off") })),
      Api.setResponseBody(ExampleSchemaOptionalField)
    )
  )
)

// Example Post, request body

export const exampleApiRequestBody = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello").pipe(
      Api.setRequestBody(Schema.struct({
        foo: Schema.string
      })),
      Api.setResponseBody(Schema.string)
    )
  )
)

// Example Post, request headers

export const exampleApiRequestHeaders = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello").pipe(
      Api.setRequestHeaders(Schema.struct({
        "X-HEADER": Schema.literal("a", "b")
      })),
      Api.setResponseBody(Schema.string)
    )
  )
)

// Example Post, path headers

export const exampleApiParams = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello/:value").pipe(
      Api.setResponseBody(Schema.string),
      Api.setRequestPath(Schema.struct({
        value: Schema.literal("a", "b")
      }))
    )
  )
)

// Example PUT

export const exampleApiPutResponse = Api.make().pipe(
  Api.addEndpoint(
    Api.put("myOperation", "/my-operation").pipe(
      Api.setResponseBody(Schema.string)
    )
  )
)

// Example POST, multiple responses
export const exampleApiMultipleResponses = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello").pipe(
      Api.setRequestQuery(Schema.struct({ value: Schema.NumberFromString })),
      Api.setResponseStatus(201),
      Api.setResponseBody(Schema.number),
      Api.addResponse({
        status: 220,
        body: Schema.number,
        headers: Schema.struct({ "x-another-200": Schema.NumberFromString })
      }),
      Api.addResponse(ApiResponse.make(204, ApiSchema.Ignored, Schema.struct({ "x-another": Schema.NumberFromString })))
    )
  )
)

// Example POST, all request locations optional

export const exampleApiOptional = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello/:value/another/:another?").pipe(
      Api.setRequestQuery(Schema.struct({
        value: Schema.NumberFromString,
        another: Schema.optional(Schema.string, { exact: true })
      })),
      Api.setRequestPath(Schema.struct({
        value: Schema.NumberFromString,
        another: Schema.optional(Schema.string, { exact: true })
      })),
      Api.setRequestHeaders(Schema.struct({
        value: Schema.NumberFromString,
        another: Schema.optional(Schema.string, { exact: true }),
        hello: Schema.optional(Schema.string, { exact: true })
      })),
      Api.setResponseBody(Schema.struct({
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
      }))
    )
  )
)

// Example POST, optional params

export const exampleApiOptionalParams = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello/:value/another/:another?").pipe(
      Api.setRequestPath(Schema.struct({
        value: Schema.NumberFromString,
        another: Schema.optional(Schema.string, { exact: true })
      })),
      Api.setResponseBody(Schema.struct({
        params: Schema.struct({
          value: Schema.number,
          another: Schema.optional(Schema.string, { exact: true })
        })
      }))
    )
  )
)

// Example POSTs, full response

export const exampleApiFullResponse = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello").pipe(
      Api.setResponseBody(Schema.number),
      Api.setResponseHeaders(Schema.struct({ "My-Header": Schema.string }))
    )
  ),
  Api.addEndpoint(
    Api.post("another", "/another").pipe(
      Api.setResponseBody(Schema.number)
    )
  )
)

export const exampleApiMultipleQueryValues = Api.make().pipe(
  Api.addEndpoint(
    Api.post("test", "/test").pipe(
      Api.setRequestQuery(Schema.struct({ value: Schema.literal("x", "y"), another: Schema.string })),
      Api.setResponseBody(Schema.string)
    )
  )
)

export const exampleApiRepresentations = Api.make().pipe(
  Api.addEndpoint(
    Api.post("test", "/test").pipe(
      Api.setResponseStatus(200),
      Api.setResponseBody(Schema.string),
      Api.setResponseRepresentations([Representation.plainText, Representation.json])
    )
  )
)

const mySecurity = pipe(
  Security.bearer({
    name: "myAwesomeBearer",
    bearerFormat: "test bearerFormat",
    description: "My awesome http bearer description"
  }),
  Security.or(Security.basic({ name: "myAwesomeBearer2", description: "My awesome http basic description 2" }))
)

export const exampleApiSecurityBearerAndBasic = Api.make().pipe(
  Api.addEndpoint(
    Api.post("test", "/test", { description: "test description" }).pipe(
      Api.setResponseBody(Schema.string),
      Api.setSecurity(mySecurity)
    )
  )
)
