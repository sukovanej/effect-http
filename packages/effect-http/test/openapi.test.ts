import SwaggerParser from "@apidevtools/swagger-parser"
import { Schema } from "@effect/schema"
import { pipe } from "effect"
import { expect, it, test } from "vitest"

import { Api, ApiGroup, OpenApi, QuerySchema, Security } from "effect-http"

import { describe } from "node:test"

test("description", () => {
  const api = pipe(
    Api.make(),
    Api.addEndpoint(
      Api.put("myOperation", "/my-operation", { description: "my description" }).pipe(
        Api.setResponseBody(Schema.String)
      )
    )
  )

  const openApi = OpenApi.make(api)

  expect(openApi.paths["/my-operation"].put?.description).toEqual(
    "my description"
  )
})

test("reference and schema component", () => {
  const responseSchema = pipe(
    Schema.Struct({ someString: Schema.String }),
    Schema.annotations({ identifier: "ResponseSchema" })
  )

  const api = pipe(
    Api.make(),
    Api.addEndpoint(
      Api.put("myOperation", "/my-operation", { description: "my description" }).pipe(
        Api.setResponseBody(responseSchema)
      )
    )
  )

  const openApi = OpenApi.make(api)
  expect(openApi).toStrictEqual({
    openapi: "3.0.3",
    info: {
      title: "Api",
      version: "1.0.0"
    },
    tags: [{ "name": "default" }],
    paths: {
      "/my-operation": {
        put: {
          operationId: "myOperation",
          tags: ["default"],
          responses: {
            "200": {
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ResponseSchema"
                  }
                }
              },
              description: "Response 200"
            }
          },
          description: "my description"
        }
      }
    },
    components: {
      schemas: {
        ResponseSchema: {
          type: "object",
          properties: {
            someString: {
              type: "string",
              description: "a string"
            }
          },
          required: ["someString"]
        }
      }
    }
  })
})

test("full info object", () => {
  const api = Api.make({
    title: "My awesome pets API",
    version: "1.0.0",
    description: "my description",
    license: { name: "MIT" }
  })

  expect(OpenApi.make(api)).toEqual({
    openapi: "3.0.3",
    info: {
      title: "My awesome pets API",
      version: "1.0.0",
      description: "my description",
      license: { name: "MIT" }
    },
    paths: {}
  })
})

test("group info", () => {
  const responseSchema = pipe(
    Schema.Struct({ someString: Schema.String }),
    Schema.annotations({ identifier: "ResponseSchema" })
  )

  const api = Api.make().pipe(
    Api.addEndpoint(
      Api.put(
        "operationWithoutGroup",
        "/operation-without-group",
        { description: "my description" }
      ).pipe(Api.setResponseBody(responseSchema))
    ),
    Api.addGroup(
      ApiGroup.make("test group", {
        description: "test description",
        externalDocs: {
          url: "http://localhost:8080",
          description: "Test external Docs description"
        }
      }).pipe(
        ApiGroup.addEndpoint(
          ApiGroup.put("myOperation", "/my-operation", { description: "my description" }).pipe(
            ApiGroup.setResponseBody(responseSchema)
          )
        )
      )
    )
  )

  expect(OpenApi.make(api)).toEqual({
    openapi: "3.0.3",
    info: {
      title: "Api",
      version: "1.0.0"
    },
    tags: [{ name: "default" }, {
      name: "test group",
      description: "test description",
      externalDocs: {
        url: "http://localhost:8080",
        description: "Test external Docs description"
      }
    }],
    paths: {
      "/operation-without-group": {
        put: {
          operationId: "operationWithoutGroup",
          tags: ["default"],
          responses: {
            "200": {
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ResponseSchema"
                  }
                }
              },
              description: "Response 200"
            }
          },
          description: "my description"
        }
      },
      "/my-operation": {
        put: {
          operationId: "myOperation",
          tags: ["test group"],
          responses: {
            "200": {
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ResponseSchema"
                  }
                }
              },
              description: "Response 200"
            }
          },
          description: "my description"
        }
      }
    },
    components: {
      schemas: {
        ResponseSchema: {
          type: "object",
          properties: {
            someString: {
              type: "string",
              description: "a string"
            }
          },
          required: ["someString"]
        }
      }
    }
  })
})

test("request body", () => {
  const api = pipe(
    Api.make(),
    Api.addEndpoint(
      Api.post("myOperation", "/my-operation").pipe(
        Api.setRequestBody(Schema.Struct({ a: Schema.String }))
      )
    )
  )

  const openApi = OpenApi.make(api)

  expect(openApi.paths["/my-operation"].post?.requestBody).toEqual({
    content: {
      "application/json": {
        schema: {
          properties: {
            a: {
              "description": "a string",
              "type": "string"
            }
          },
          required: [
            "a"
          ],
          type: "object"
        }
      }
    },
    required: true
  })
})

test("union in query params", () => {
  const api = pipe(
    Api.make(),
    Api.addEndpoint(
      Api.post("myOperation", "/my-operation").pipe(
        Api.setRequestQuery(Schema.Union(
          Schema.Struct({ a: Schema.String }),
          Schema.Struct({ a: QuerySchema.Number, b: Schema.String }),
          Schema.Struct({ a: QuerySchema.Number, c: Schema.String }).pipe(
            Schema.attachPropertySignature("_tag", "Case2")
          )
        ))
      )
    )
  )

  const openApi = OpenApi.make(api)

  expect(openApi.paths["/my-operation"].post?.parameters).toEqual([
    {
      "in": "query",
      "name": "a",
      "required": true,
      "schema": {
        "oneOf": [
          {
            "description": "a string",
            "type": "string"
          },
          {
            "description": "a number",
            "type": "number"
          },
          // TODO: this doesnt look correct
          {
            "description": "a number",
            "type": "number"
          }
        ]
      }
    },
    {
      "description": "a string",
      "in": "query",
      "name": "b",
      "schema": {
        "description": "a string",
        "type": "string"
      }
    },
    {
      "description": "a string",
      "in": "query",
      "name": "c",
      "schema": {
        "description": "a string",
        "type": "string"
      }
    }
  ])
})

test("http security scheme", () => {
  const api = pipe(
    Api.make(),
    Api.addEndpoint(
      Api.post("myOperation", "/my-operation", { description: "options" }).pipe(
        Api.setResponseBody(Schema.String),
        Api.setRequestQuery(Schema.Union(
          Schema.Struct({ a: Schema.String }),
          Schema.Struct({ a: Schema.NumberFromString, b: Schema.String }),
          Schema.Struct({ a: Schema.NumberFromString, c: Schema.String }).pipe(
            Schema.attachPropertySignature("_tag", "Case2")
          )
        )),
        Api.setSecurity(
          Security.bearer({ name: "mayAwesomeAuth", bearerFormat: "jwt", description: "mayAwesomeAuth description" })
        )
      )
    )
  )

  const openApi = OpenApi.make(api)

  expect(openApi.paths["/my-operation"].post?.security).toEqual([{ mayAwesomeAuth: [] }])
  expect(openApi.components?.securitySchemes).toEqual({
    mayAwesomeAuth: {
      type: "http",
      scheme: "bearer",
      description: "mayAwesomeAuth description",
      bearerFormat: "jwt"
    }
  })
})

test("arbitrary status with empty response is allowed", () => {
  const api = pipe(
    Api.make(),
    Api.addEndpoint(
      Api.post("myOperation", "/my-operation", { description: "options" }).pipe(
        Api.addResponse({ status: 401 })
      )
    )
  )

  const openApi = OpenApi.make(api)

  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  expect(((openApi.paths["/my-operation"].post?.responses![401])!).content).toBe(undefined)
})

test("response header as union", () => {
  const api = pipe(
    Api.make(),
    Api.addEndpoint(
      Api.post("myOperation", "/my-operation", { description: "options" }).pipe(
        Api.setResponseHeaders(Schema.Union(Schema.Struct({}), Schema.Struct({ a: Schema.String })))
      )
    )
  )

  const openApi = OpenApi.make(api)

  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  const headerSpec = ((openApi.paths["/my-operation"].post?.responses![200])!).headers!["a"]

  expect(headerSpec).toEqual({ description: "a string", schema: { description: "a string", type: "string" } })
})

// https://swagger.io/docs/specification/data-models/enums/

describe("enums", () => {
  it("literals", () => {
    const schema = Schema.Literal("asc", "desc")

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "string",
      enum: ["asc", "desc"]
    })
  })

  it("nullable literals", () => {
    const schema = pipe(Schema.Literal("asc", "desc"), Schema.NullOr)

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "string",
      nullable: true,
      enum: ["asc", "desc"]
    })
  })

  it("enum", () => {
    enum Enum {
      Asc = "asc",
      Desc = "desc"
    }
    const schema = Schema.Enums(Enum)

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "string",
      enum: ["asc", "desc"]
    })
  })

  it("nullable enum", () => {
    enum Enum {
      Asc = "asc",
      Desc = "desc"
    }
    const schema = pipe(Schema.Enums(Enum), Schema.NullOr)

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "string",
      nullable: true,
      enum: ["asc", "desc", null]
    })
  })
})

// https://swagger.io/docs/specification/data-models/dictionaries/

describe("records", () => {
  it("string to string map", () => {
    const schema = Schema.Record({ key: Schema.String, value: Schema.String })

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "object",
      additionalProperties: {
        description: "a string",
        type: "string"
      }
    })
  })

  it("string to object map", () => {
    const schema = Schema.Record({
      key: Schema.String,
      value: Schema.Struct({
        code: Schema.optionalWith(Schema.Number, { exact: true }),
        text: Schema.optional(Schema.String)
      })
    })

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          code: {
            description: "a number",
            type: "number"
          },
          text: {
            description: "a string",
            type: "string"
          }
        }
      }
    })
  })
})

test("Declaration", () => {
  const MySchema = Schema.instanceOf(FormData).pipe(
    OpenApi.annotate(() => ({ type: "string" })),
    Schema.annotations({ description: "form data" })
  )

  expect(OpenApi.makeSchema(MySchema)).toEqual({
    type: "string",
    description: "form data"
  })
})

// https://swagger.io/docs/specification/data-models/data-types/

describe("data types", () => {
  it("boolean", () => {
    const schema = Schema.Boolean

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      description: "a boolean",
      type: "boolean"
    })
  })

  it("string", () => {
    const schema = Schema.String

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      description: "a string",
      type: "string"
    })
  })

  it("branded string", () => {
    const schema = pipe(Schema.String, Schema.brand("my-string"))

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      description: "a string",
      type: "string"
    })
  })

  it("string with minLength", () => {
    const schema = pipe(Schema.String, Schema.minLength(1))

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "string",
      minLength: 1,
      description: "a string at least 1 character(s) long"
    })
  })

  it("string with maxLength", () => {
    const schema = pipe(Schema.String, Schema.maxLength(10))

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "string",
      maxLength: 10,
      description: "a string at most 10 character(s) long"
    })
  })

  it("string with minLength and maxLength", () => {
    const schema = pipe(
      Schema.String,
      Schema.minLength(1),
      Schema.maxLength(10)
    )

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "string",
      minLength: 1,
      maxLength: 10,
      description: "a string at most 10 character(s) long"
    })
  })

  it("string with pattern", () => {
    const schema = pipe(Schema.String, Schema.pattern(/^\d{3}-\d{2}-\d{4}$/))

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "string",
      pattern: "^\\d{3}-\\d{2}-\\d{4}$",
      description: "a string matching the pattern ^\\d{3}-\\d{2}-\\d{4}$"
    })
  })

  it("number", () => {
    const schema = Schema.Number

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      description: "a number",
      type: "number"
    })
  })

  it("integer", () => {
    const schema = pipe(Schema.Number, Schema.int())

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "integer",
      description: "an integer"
    })
  })

  it("integer with exclusive min", () => {
    const schema = pipe(Schema.Number, Schema.int(), Schema.greaterThan(10))

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "integer",
      exclusiveMinimum: true,
      minimum: 10,
      description: "a number greater than 10"
    })
  })

  it("integer with exclusive max", () => {
    const schema = pipe(Schema.Number, Schema.int(), Schema.lessThan(10))

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "integer",
      exclusiveMaximum: true,
      maximum: 10,
      description: "a number less than 10"
    })
  })

  it("integer with non-exclusive min", () => {
    const schema = pipe(
      Schema.Number,
      Schema.int(),
      Schema.greaterThanOrEqualTo(10)
    )

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "integer",
      minimum: 10,
      description: "a number greater than or equal to 10"
    })
  })

  it("integer with non-exclusive max", () => {
    const schema = pipe(
      Schema.Number,
      Schema.int(),
      Schema.lessThanOrEqualTo(10)
    )

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "integer",
      maximum: 10,
      description: "a number less than or equal to 10"
    })
  })

  it("number with exclusive min", () => {
    const schema = pipe(Schema.Number, Schema.greaterThan(10))

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "number",
      exclusiveMinimum: true,
      minimum: 10,
      description: "a number greater than 10"
    })
  })

  it("number with exclusive max", () => {
    const schema = pipe(Schema.Number, Schema.lessThan(10))

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "number",
      exclusiveMaximum: true,
      maximum: 10,
      description: "a number less than 10"
    })
  })

  it("number with non-exclusive min", () => {
    const schema = pipe(Schema.Number, Schema.greaterThanOrEqualTo(10))

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "number",
      minimum: 10,
      description: "a number greater than or equal to 10"
    })
  })

  it("number with non-exclusive max", () => {
    const schema = pipe(Schema.Number, Schema.lessThanOrEqualTo(10))

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "number",
      maximum: 10,
      description: "a number less than or equal to 10"
    })
  })

  it("parsed number", () => {
    const schema = Schema.NumberFromString

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "string",
      description: "a string"
    })
  })
})

describe("nullable data types", () => {
  it("nullable number", () => {
    const schema = pipe(Schema.Number, Schema.NullOr)

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "number",
      description: "a number",
      nullable: true
    })
  })

  it("nullable string", () => {
    const schema = pipe(Schema.String, Schema.NullOr)

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "string",
      description: "a string",
      nullable: true
    })
  })

  it("nullable string array", () => {
    const schema = pipe(Schema.String, Schema.Array, Schema.NullOr)

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "array",
      items: { type: "string", description: "a string" },
      nullable: true
    })
  })
})

describe("arrays", () => {
  it("number array", () => {
    const schema = Schema.Array(Schema.Number)

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "array",
      items: { type: "number", description: "a number" }
    })
  })

  it("string array", () => {
    const schema = pipe(Schema.String, Schema.Array)

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "array",
      items: { type: "string", description: "a string" }
    })
  })

  it("2d number array", () => {
    const schema = pipe(Schema.Number, Schema.Array, Schema.Array)

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "array",
      items: {
        type: "array",
        items: { type: "number", description: "a number" }
      }
    })
  })

  it("object array", () => {
    const schema = pipe(Schema.Struct({ id: Schema.Number }), Schema.Array)

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "number", description: "a number" } },
        required: ["id"]
      }
    })
  })

  it("mixed type array", () => {
    const schema = pipe(
      Schema.Union(Schema.Number, Schema.String),
      Schema.Array
    )

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "array",
      items: {
        oneOf: [
          { type: "number", description: "a number" },
          { type: "string", description: "a string" }
        ]
      }
    })
  })

  it("array of any items", () => {
    const schema = Schema.Array(Schema.Any)

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "array",
      items: {}
    })
  })

  it("single item array", () => {
    const schema = Schema.Tuple(Schema.String)

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "array",
      items: {
        type: "string",
        description: "a string"
      },
      minItems: 1,
      maxItems: 1
    })
  })

  it("non-empty array", () => {
    const schema = Schema.NonEmptyArray(Schema.String)

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "array",
      items: {
        type: "string",
        description: "a string"
      },
      minItems: 1
    })
  })

  // TODO: array length
  // TODO: unique items
})

describe("objects", () => {
  it("object", () => {
    const schema = Schema.Struct({
      id: Schema.int()(Schema.Number),
      name: Schema.String
    })

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "object",
      properties: {
        id: { type: "integer", description: "an integer" },
        name: { type: "string", description: "a string" }
      },
      required: ["name", "id"]
    })
  })

  it("object with non-required", () => {
    const schema = Schema.Object

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "object",
      description: "an object in the TypeScript meaning, i.e. the `object` type"
    })
  })

  it("object with non-required", () => {
    const schema = Schema.Struct({
      id: Schema.int()(Schema.Number),
      username: Schema.String,
      name: Schema.optional(Schema.String)
    })

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "object",
      properties: {
        id: { type: "integer", description: "an integer" },
        name: { type: "string", description: "a string" },
        username: { type: "string", description: "a string" }
      },
      required: ["username", "id"]
    })
  })

  it("brands", () => {
    const schema = pipe(
      Schema.Struct({
        id: Schema.int()(Schema.Number),
        username: Schema.String,
        name: Schema.optional(Schema.String)
      }),
      Schema.brand("my-schema")
    )

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "object",
      properties: {
        id: { type: "integer", description: "an integer" },
        name: { description: "a string", type: "string" },
        username: { description: "a string", type: "string" }
      },
      required: ["username", "id"]
    })
  })
})

it("optionFromNullable", () => {
  const schema = Schema.Struct({
    value: Schema.OptionFromNullOr(Schema.String)
  })

  expect(OpenApi.makeSchema(schema)).toStrictEqual({
    type: "object",
    properties: {
      value: { description: "a string", type: "string", nullable: true }
    },
    required: ["value"]
  })
})

describe("description annotation", () => {
  test("null", () => {
    const schema = pipe(
      Schema.Null,
      Schema.annotations({ description: "it is always missing" })
    )

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "null",
      description: "it is always missing"
    })
  })

  test("string", () => {
    const schema = pipe(Schema.String, Schema.annotations({ description: "my description" }))

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "string",
      description: "my description"
    })
  })

  test("number", () => {
    const schema = pipe(Schema.Number, Schema.annotations({ description: "my description" }))

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "number",
      description: "my description"
    })
  })

  test("boolean", () => {
    const schema = pipe(Schema.Boolean, Schema.annotations({ description: "my description" }))

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "boolean",
      description: "my description"
    })
  })

  test("object", () => {
    const schema = pipe(Schema.Object, Schema.annotations({ description: "my description" }))

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "object",
      description: "my description"
    })
  })

  test("tuple", () => {
    const schema = pipe(
      Schema.Tuple(Schema.annotations(Schema.String, { description: "my description" })),
      Schema.annotations({ description: "my description" })
    )

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "array",
      items: {
        type: "string",
        description: "my description"
      },
      minItems: 1,
      maxItems: 1,
      description: "my description"
    })
  })

  it("type literal", () => {
    const schema = pipe(
      Schema.Struct({
        id: pipe(
          Schema.Number,
          Schema.int(),
          Schema.annotations({ description: "id description" })
        ),
        name: pipe(
          Schema.Literal("value"),
          Schema.annotations({ description: "value description" })
        )
      }),
      Schema.annotations({ description: "my description" })
    )

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "object",
      properties: {
        id: { type: "integer", description: "id description" },
        name: { type: "string", enum: ["value"], description: "value description" }
      },
      required: ["name", "id"],
      description: "my description"
    })
  })

  test("union", () => {
    const schema = pipe(
      Schema.Literal("value", "another"),
      Schema.annotations({ description: "my description" })
    )

    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      type: "string",
      enum: ["value", "another"],
      description: "my description"
    })
  })

  test.each([
    Schema.Struct({ createdAt: Schema.Date }),
    Schema.Struct({ createdAt: Schema.Date.pipe(Schema.brand("brand")) }),
    Schema.Struct({
      createdAt: Schema.Date.pipe(
        Schema.filter((a) => a.getFullYear() === 2024, { message: () => "must be 2024" })
      )
    })
  ])("date %#", (schema) => {
    expect(OpenApi.makeSchema(schema)).toStrictEqual({
      properties: {
        createdAt: {
          description: "a valid Date",
          type: "string",
          format: "date-time"
        }
      },
      required: [
        "createdAt"
      ],
      type: "object"
    })
  })
})

const recursiveOpenApiDefinition = {
  openapi: "3.0.3",
  info: {
    title: "test",
    version: "0.1"
  },
  tags: [{ "name": "default" }],
  paths: {
    "/pet": {
      post: {
        tags: ["default"],
        operationId: "getPet",
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Category"
                }
              }
            },
            description: "Response 200"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Category: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "a string"
          },
          categories: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Category"
            }
          }
        },
        required: ["name", "categories"]
      }
    }
  }
}

describe("component schema and reference", () => {
  it("reference only", async () => {
    const ReferencedType = pipe(
      Schema.Struct({ something: Schema.String }),
      Schema.annotations({ identifier: "ReferencedType" })
    )

    const api = Api.make({ title: "test", version: "0.1" }).pipe(
      Api.addEndpoint(
        Api.post("getPet", "/pet").pipe(Api.setResponseBody(ReferencedType))
      )
    )
    const spec = OpenApi.make(api)

    const openapi = {
      openapi: "3.0.3",
      info: { title: "test", version: "0.1" },
      tags: [{ "name": "default" }],
      paths: {
        "/pet": {
          post: {
            tags: ["default"],
            operationId: "getPet",
            responses: {
              200: {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ReferencedType"
                    }
                  }
                },
                description: "Response 200"
              }
            }
          }
        }
      },
      components: {
        schemas: {
          ReferencedType: {
            properties: {
              something: {
                description: "a string",
                type: "string"
              }
            },
            required: ["something"],
            type: "object"
          }
        }
      }
    }
    expect(spec).toStrictEqual(openapi)

    // @ts-expect-error
    SwaggerParser.validate(spec)
  })

  it("reference with sub schema as reference", async () => {
    const ReferencedSubType = pipe(
      Schema.Struct({ more: Schema.String }),
      Schema.annotations({ identifier: "ReferencedSubType" })
    )
    const ReferencedType = pipe(
      Schema.Struct({ something: Schema.String, sub: ReferencedSubType }),
      Schema.annotations({ identifier: "ReferencedType" })
    )
    const api = Api.make({ title: "test", version: "0.1" }).pipe(
      Api.addEndpoint(
        Api.post("getPet", "/pet").pipe(Api.setResponseBody(ReferencedType))
      )
    )
    const spec = OpenApi.make(api)
    const openapi = {
      openapi: "3.0.3",
      info: { title: "test", version: "0.1" },
      tags: [{ "name": "default" }],
      paths: {
        "/pet": {
          post: {
            tags: ["default"],
            operationId: "getPet",
            responses: {
              200: {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ReferencedType"
                    }
                  }
                },
                description: "Response 200"
              }
            }
          }
        }
      },
      components: {
        schemas: {
          ReferencedType: {
            properties: {
              something: {
                description: "a string",
                type: "string"
              },
              sub: {
                $ref: "#/components/schemas/ReferencedSubType"
              }
            },
            required: ["something", "sub"],
            type: "object"
          },
          ReferencedSubType: {
            properties: {
              more: {
                description: "a string",
                type: "string"
              }
            },
            required: ["more"],
            type: "object"
          }
        }
      }
    }
    expect(spec).toStrictEqual(openapi)

    // @ts-expect-error
    SwaggerParser.validate(spec)
  })

  it("enum as reference", async () => {
    enum MyEnum {
      test1 = "test1",
      test2 = "test2"
    }
    const ReferencedEnum = pipe(
      Schema.Enums(MyEnum),
      Schema.annotations({ identifier: "ReferencedEnum" })
    )
    const api = Api.make({ title: "test", version: "0.1" }).pipe(
      Api.addEndpoint(
        Api.post("getPet", "/pet").pipe(Api.setResponseBody(ReferencedEnum))
      )
    )
    const spec = OpenApi.make(api)
    const openapi = {
      openapi: "3.0.3",
      info: { title: "test", version: "0.1" },
      tags: [{ "name": "default" }],
      paths: {
        "/pet": {
          post: {
            tags: ["default"],
            operationId: "getPet",
            responses: {
              200: {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ReferencedEnum"
                    }
                  }
                },
                description: "Response 200"
              }
            }
          }
        }
      },
      components: {
        schemas: {
          ReferencedEnum: { type: "string", enum: ["test1", "test2"] }
        }
      }
    }
    expect(spec).toStrictEqual(openapi)
    // @ts-expect-error
    SwaggerParser.validate(spec)
  })

  it("union as reference", async () => {
    const ReferencedType1 = pipe(
      Schema.Struct({ something1: Schema.String }),
      Schema.annotations({ identifier: "ReferencedType1" })
    )
    const ReferencedType2 = pipe(
      Schema.Struct({ something2: Schema.String }),
      Schema.annotations({ identifier: "ReferencedType2" })
    )
    const ReferencedUnion = Schema.Union(
      ReferencedType1,
      ReferencedType2
    ).pipe(Schema.annotations({ identifier: "ReferencedUnion" }))
    const api = Api.make({ title: "test", version: "0.1" }).pipe(
      Api.addEndpoint(
        Api.post("getPet", "/pet").pipe(Api.setResponseBody(ReferencedUnion))
      )
    )
    const spec = OpenApi.make(api)
    const openapi = {
      openapi: "3.0.3",
      info: { title: "test", version: "0.1" },
      tags: [{ "name": "default" }],
      paths: {
        "/pet": {
          post: {
            tags: ["default"],
            operationId: "getPet",
            responses: {
              200: {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ReferencedUnion"
                    }
                  }
                },
                description: "Response 200"
              }
            }
          }
        }
      },
      components: {
        schemas: {
          ReferencedUnion: {
            oneOf: [
              { "$ref": "#/components/schemas/ReferencedType1" },
              { "$ref": "#/components/schemas/ReferencedType2" }
            ]
          },
          ReferencedType2: {
            type: "object",
            properties: { something2: { type: "string", description: "a string" } },
            required: ["something2"]
          },
          ReferencedType1: {
            type: "object",
            properties: { something1: { type: "string", description: "a string" } },
            required: ["something1"]
          }
        }
      }
    }
    expect(spec).toStrictEqual(openapi)
    // @ts-expect-error
    SwaggerParser.validate(spec)
  })

  it("reference with recursive reference and identifier inside lazy", async () => {
    interface Category {
      readonly name: string
      readonly categories: ReadonlyArray<Category>
    }
    const categorySchema: Schema.Schema<Category> = Schema.suspend<Category, Category, never>(() =>
      Schema.Struct({
        name: Schema.String,
        categories: Schema.Array(categorySchema)
      }).pipe(Schema.annotations({ identifier: "Category" }))
    )
    const api = Api.make({ title: "test", version: "0.1" }).pipe(
      Api.addEndpoint(
        Api.post("getPet", "/pet").pipe(Api.setResponseBody(categorySchema))
      )
    )
    const spec = OpenApi.make(api)
    expect(spec).toStrictEqual(recursiveOpenApiDefinition)

    // @ts-expect-error
    SwaggerParser.validate(spec)
  })

  it("reference with recursive reference and identifier on lazy", async () => {
    interface Category {
      readonly name: string
      readonly categories: ReadonlyArray<Category>
    }

    const categorySchema: Schema.Schema<Category, Category, never> = Schema.suspend<Category, Category, never>(() =>
      Schema.Struct({
        name: Schema.String,
        categories: Schema.Array(categorySchema)
      })
    ).pipe(Schema.annotations({ identifier: "Category" }))

    const api = Api.make({ title: "test", version: "0.1" }).pipe(
      Api.addEndpoint(
        Api.post("getPet", "/pet").pipe(Api.setResponseBody(categorySchema))
      )
    )
    const spec = OpenApi.make(api)
    expect(spec).toStrictEqual(recursiveOpenApiDefinition)

    // @ts-expect-error
    SwaggerParser.validate(spec)
  })

  // reported in https://github.com/sukovanej/effect-http/issues/471
  it.each(
    [
      Schema.optionalWith(Schema.Date, { nullable: true, exact: true, as: "Option" }),
      Schema.optionalWith(Schema.Date, { nullable: true, default: () => new Date() }),
      Schema.optionalWith(Schema.Date, { exact: true, default: () => new Date() }),
      Schema.optionalWith(Schema.Date, { exact: true, as: "Option" }),
      Schema.optionalWith(Schema.Date, { nullable: true, as: "Option" }),
      Schema.optionalWith(Schema.Date, { as: "Option" }),
      Schema.optionalWith(Schema.Date, { exact: true }),
      Schema.optional(Schema.Date)
    ]
  )("optional variants", async (fieldSchema) => {
    const MySchema = Schema.Struct({ field: fieldSchema }).pipe(Schema.annotations({ identifier: "Foo" }))

    const api = Api.make({ title: "test", version: "0.1" }).pipe(
      Api.addEndpoint(
        Api.post("getPet", "/pet").pipe(Api.setResponseBody(MySchema))
      )
    )
    const spec = OpenApi.make(api)

    expect(Object.keys(spec.components!.schemas!)).toHaveLength(1)
  })

  it("Schema.optional in parameters", () => {
    const schema = Schema.Struct({ field: Schema.optional(Schema.String) })
    const api = pipe(
      Api.make(),
      Api.addEndpoint(
        Api.put("myOperation", "/my-operation").pipe(
          Api.setResponseBody(schema),
          Api.setRequestQuery(schema)
        )
      )
    )

    const openApi = OpenApi.make(api)

    expect(openApi.paths["/my-operation"]).toEqual({
      "put": {
        "operationId": "myOperation",
        "parameters": [
          {
            "description": "a string",
            "in": "query",
            "name": "field",
            "schema": {
              "description": "a string",
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "field": {
                      "description": "a string",
                      "type": "string"
                    }
                  },
                  "type": "object"
                }
              }
            },
            "description": "Response 200"
          }
        },
        "tags": ["default"]
      }
    })
  })

  it("reference with class schema", async () => {
    class ReferencedType extends Schema.Class<ReferencedType>("ReferencedType")(
      Schema.Struct({ something: Schema.String })
    ) {}

    const api = Api.make({ title: "test", version: "0.1" }).pipe(
      Api.addEndpoint(
        Api.post("getPet", "/pet").pipe(Api.setResponseBody(ReferencedType))
      )
    )
    const spec = OpenApi.make(api)

    const openapi = {
      openapi: "3.0.3",
      info: { title: "test", version: "0.1" },
      tags: [{ "name": "default" }],
      paths: {
        "/pet": {
          post: {
            tags: ["default"],
            operationId: "getPet",
            responses: {
              200: {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ReferencedType"
                    }
                  }
                },
                description: "Response 200"
              }
            }
          }
        }
      },
      components: {
        schemas: {
          ReferencedType: {
            properties: {
              something: {
                description: "a string",
                type: "string"
              }
            },
            required: ["something"],
            type: "object"
          }
        }
      }
    }
    expect(spec).toStrictEqual(openapi)

    // @ts-expect-error
    SwaggerParser.validate(spec)
  })

  it("reference and security", async () => {
    class ReferencedType extends Schema.Class<ReferencedType>("ReferencedType")(
      Schema.Struct({ something: Schema.String })
    ) {}

    const api = Api.make({ title: "test", version: "0.1" }).pipe(
      Api.addEndpoint(
        Api.post("getPet", "/pet").pipe(
          Api.setResponseBody(ReferencedType),
          Api.setSecurity(Security.basic())
        )
      )
    )
    const spec = OpenApi.make(api)
    expect(spec.components?.schemas).toBeTruthy()
    expect(spec.components?.securitySchemes).toBeTruthy()

    // @ts-expect-error
    SwaggerParser.validate(spec)
  })
})
