import * as Schema from "@effect/schema/Schema";
import * as Http from "effect-http";

// Example GET

export const exampleApiGet = Http.api().pipe(
  Http.get("getValue", "/get-value", { response: Schema.number }),
);

// Example GET, string response

export const exampleApiGetStringResponse = Http.api().pipe(
  Http.get("hello", "/hello", { response: Schema.number }),
);

// Example POST, nullable body field

const ExampleSchemaNullableField = Schema.struct({
  value: Schema.optionFromNullable(Schema.string),
});

export const exampleApiPostNullableField = Http.api().pipe(
  Http.post("test", "/test", {
    response: ExampleSchemaNullableField,
  }),
);

// Example GET, query parameter

export const exampleApiGetQueryParameter = Http.api().pipe(
  Http.get("hello", "/hello", {
    request: {
      query: Schema.struct({
        country: Schema.string.pipe(Schema.pattern(/^[A-Z]{2}$/)),
      }),
    },
    response: Schema.string,
  }),
);

// Example GET, headers

export const exampleApiGetHeaders = Http.api().pipe(
  Http.get("hello", "/hello", {
    response: Schema.struct({ clientIdHash: Schema.string }),
    request: {
      headers: Schema.struct({ "X-Client-Id": Schema.string }),
    },
  }),
);

// Example GET, custom response with headers

export const exampleApiGetCustomResponseWithHeaders = Http.api().pipe(
  Http.get("hello", "/hello", {
    response: {
      status: 201,
      content: Schema.struct({ value: Schema.string }),
      headers: Schema.struct({
        "My-Header": Schema.literal("hello"),
      }),
    },
  }),
);

// Example GET, option response field

const ExampleSchemaOptionalField = Schema.struct({
  foo: Schema.optional(Schema.string).toOption(),
});

export const exampleApiGetOptionalField = Http.api().pipe(
  Http.get("hello", "/hello", {
    response: ExampleSchemaOptionalField,
    request: {
      query: Schema.struct({
        value: Schema.literal("on", "off"),
      }),
    },
  }),
);

// Example Post, request body

export const exampleApiRequestBody = Http.api().pipe(
  Http.post("hello", "/hello", {
    response: Schema.string,
    request: {
      body: Schema.struct({
        foo: Schema.string,
      }),
    },
  }),
);

// Example Post, request headers

export const exampleApiRequestHeaders = Http.api().pipe(
  Http.post("hello", "/hello", {
    response: Schema.string,
    request: {
      headers: Schema.struct({
        "X-HEADER": Schema.literal("a", "b"),
      }),
    },
  }),
);

// Example Post, path headers

export const exampleApiParams = Http.api().pipe(
  Http.post("hello", "/hello/:value", {
    response: Schema.string,
    request: {
      params: Schema.struct({
        value: Schema.literal("a", "b"),
      }),
    },
  }),
);

// Example PUT

export const exampleApiPutResponse = Http.api().pipe(
  Http.put("myOperation", "/my-operation", { response: Schema.string }),
);

// Example POST, multiple responses
export const exampleApiMultipleResponses = Http.api().pipe(
  Http.post("hello", "/hello", {
    response: [
      {
        status: 201,
        content: Schema.number,
      },
      {
        status: 200,
        content: Schema.number,
        headers: Schema.struct({
          "X-Another-200": Schema.NumberFromString,
        }),
      },
      {
        status: 204,
        headers: Schema.struct({ "X-Another": Schema.NumberFromString }),
      },
    ],
    request: {
      query: Schema.struct({
        value: Schema.NumberFromString,
      }),
    },
  }),
);

// Example POST, all request locations optional

export const exampleApiOptional = Http.api().pipe(
  Http.post("hello", "/hello/:value/another/:another?", {
    response: Schema.struct({
      query: Schema.struct({
        value: Schema.number,
        another: Schema.optional(Schema.string),
      }),
      params: Schema.struct({
        value: Schema.number,
        another: Schema.optional(Schema.string),
      }),
      headers: Schema.struct({
        value: Schema.number,
        another: Schema.optional(Schema.string),
        hello: Schema.optional(Schema.string),
      }),
    }),
    request: {
      query: Schema.struct({
        value: Schema.NumberFromString,
        another: Schema.optional(Schema.string),
      }),
      params: Schema.struct({
        value: Schema.NumberFromString,
        another: Schema.optional(Schema.string),
      }),
      headers: Schema.struct({
        value: Schema.NumberFromString,
        another: Schema.optional(Schema.string),
        hello: Schema.optional(Schema.string),
      }),
    },
  }),
);

// Example POST, optional params

export const exampleApiOptionalParams = Http.api().pipe(
  Http.post("hello", "/hello/:value/another/:another?", {
    response: Schema.struct({
      params: Schema.struct({
        value: Schema.number,
        another: Schema.optional(Schema.string),
      }),
    }),
    request: {
      params: Schema.struct({
        value: Schema.NumberFromString,
        another: Schema.optional(Schema.string),
      }),
    },
  }),
);

// Example POSTs, full response

export const exampleApiFullResponse = Http.api().pipe(
  Http.post("hello", "/hello", {
    response: {
      status: 200,
      content: Schema.number,
      headers: Schema.struct({
        "My-Header": Schema.string,
      }),
    },
  }),
  Http.post("another", "/another", {
    response: {
      status: 200,
      content: Schema.number,
    },
  }),
);
