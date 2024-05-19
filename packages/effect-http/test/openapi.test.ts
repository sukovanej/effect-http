import { Schema } from "@effect/schema"
import { pipe } from "effect"
import { Api, ApiGroup, OpenApi } from "effect-http"
import { Security } from "effect-http-security"
import type { OpenAPISpecStatusCode } from "schema-openapi/OpenApiTypes"
import { expect, test } from "vitest"

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
    Schema.identifier("ResponseSchema")
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
    Schema.identifier("ResponseSchema")
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
          Schema.Struct({ a: Schema.Number, b: Schema.String }),
          Schema.Struct({ a: Schema.Number, c: Schema.String }).pipe(
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
          Schema.Struct({ a: Schema.Number, b: Schema.String }),
          Schema.Struct({ a: Schema.Number, c: Schema.String }).pipe(
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
  expect(((openApi.paths["/my-operation"].post?.responses![401 as OpenAPISpecStatusCode])!).content).toBe(undefined)
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
  const headerSpec = ((openApi.paths["/my-operation"].post?.responses![200 as OpenAPISpecStatusCode])!).headers!["a"]

  expect(headerSpec).toEqual({ description: "a string", schema: { description: "a string", type: "string" } })
})
