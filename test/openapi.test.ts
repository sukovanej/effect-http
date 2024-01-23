import { Schema } from "@effect/schema"
import { pipe } from "effect"
import { Api, OpenApi } from "effect-http"
import { expect, test } from "vitest"

test("description", () => {
  const api = pipe(
    Api.api(),
    Api.put(
      "myOperation",
      "/my-operation",
      { response: Schema.string },
      { description: "my description" }
    )
  )

  const openApi = OpenApi.make(api)

  expect(openApi.paths["/my-operation"].put?.description).toEqual(
    "my description"
  )
})

test("reference and schema component", () => {
  const responseSchema = pipe(
    Schema.struct({ someString: Schema.string }),
    Schema.identifier("ResponseSchema")
  )
  const api = pipe(
    Api.api(),
    Api.put(
      "myOperation",
      "/my-operation",
      { response: responseSchema },
      { description: "my description" }
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
              description: "Response"
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
  const api = Api.api({
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
    Schema.struct({ someString: Schema.string }),
    Schema.identifier("ResponseSchema")
  )

  const api = Api.api().pipe(
    Api.put(
      "operationWithoutGroup",
      "/operation-without-group",
      { response: responseSchema },
      { description: "my description" }
    ),
    Api.addGroup(
      Api.apiGroup("test group", {
        description: "test description",
        externalDocs: {
          url: "http://localhost:8080",
          description: "Test external Docs description"
        }
      }).pipe(
        Api.put(
          "myOperation",
          "/my-operation",
          { response: responseSchema },
          { description: "my description" }
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
              description: "Response"
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
              description: "Response"
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

test("union in query params", () => {
  const api = pipe(
    Api.api(),
    Api.post(
      "myOperation",
      "/my-operation",
      {
        response: Schema.string,
        request: {
          query: Schema.union(
            Schema.struct({ a: Schema.string }),
            Schema.struct({ a: Schema.number, b: Schema.string }),
            Schema.struct({ a: Schema.number, c: Schema.string })
          )
        }
      }
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
            "description": "a number",
            "type": "number"
          },
          {
            "description": "a string",
            "type": "string"
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
