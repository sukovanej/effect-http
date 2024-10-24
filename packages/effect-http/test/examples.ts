/* eslint-disable @typescript-eslint/no-empty-object-type */
import { pipe } from "effect"
import { Api, ApiResponse, ApiSchema, QuerySchema, Representation, Security } from "effect-http"
import * as Schema from "effect/Schema"

// Example GET

export const exampleApiGet = pipe(
  Api.make(),
  Api.addEndpoint(
    pipe(
      Api.get("getValue", "/get-value"),
      Api.setResponseBody(Schema.Number)
    )
  )
)

// Example GET, string response

export const exampleApiGetStringResponse = Api.make().pipe(
  Api.addEndpoint(
    Api.get("hello", "/hello").pipe(Api.setResponseBody(Schema.Number))
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
      Api.setRequestQuery(Schema.Struct({ country: Schema.String.pipe(Schema.pattern(/^[A-Z]{2}$/)) })),
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
      Api.setRequestHeaders(Schema.Struct({ "X-Client-Id": Schema.String }))
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
        "My-Header": Schema.Literal("hello")
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
        "X-HEADER": Schema.Literal("a", "b")
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
      Api.setRequestQuery(Schema.Struct({ value: QuerySchema.Number })),
      Api.setResponseStatus(201),
      Api.setResponseBody(Schema.Number),
      Api.addResponse({
        status: 220,
        body: Schema.Number,
        headers: Schema.Struct({ "x-another-200": Schema.NumberFromString })
      }),
      Api.addResponse(ApiResponse.make(204, ApiSchema.Ignored, Schema.Struct({ "x-another": Schema.NumberFromString })))
    )
  )
)

// Example POST, all request locations optional

export const exampleApiOptional = Api.make().pipe(
  Api.addEndpoint(
    Api.post("hello", "/hello/:value/another/:another?").pipe(
      Api.setRequestQuery(Schema.Struct({
        value: QuerySchema.Number,
        another: Schema.optional(Schema.String)
      })),
      Api.setRequestPath(Schema.Struct({
        value: QuerySchema.Number,
        another: Schema.optional(Schema.String)
      })),
      Api.setRequestHeaders(Schema.Struct({
        value: QuerySchema.Number,
        another: Schema.optional(Schema.String),
        hello: Schema.optional(Schema.String)
      })),
      Api.setResponseBody(Schema.Struct({
        query: Schema.Struct({
          value: Schema.Number,
          another: Schema.optional(Schema.String)
        }),
        params: Schema.Struct({
          value: Schema.Number,
          another: Schema.optional(Schema.String)
        }),
        headers: Schema.Struct({
          value: Schema.Number,
          another: Schema.optional(Schema.String),
          hello: Schema.optional(Schema.String)
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
        value: QuerySchema.Number,
        another: Schema.optional(Schema.String)
      })),
      Api.setResponseBody(Schema.Struct({
        params: Schema.Struct({
          value: Schema.Number,
          another: Schema.optional(Schema.String)
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
      Api.setResponseHeaders(Schema.Struct({ "My-Header": Schema.String }))
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
      Api.setResponseBody(Schema.String),
      Api.setSecurity(mySecurity)
    )
  )
)
