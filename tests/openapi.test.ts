import { Schema } from "@effect/schema";
import { pipe } from "effect";
import { Api, OpenApi } from "effect-http";

test("description", () => {
  const api = pipe(
    Api.api(),
    Api.put(
      "myOperation",
      "/my-operation",
      { response: Schema.string },
      { description: "my description" },
    ),
  );

  const openApi = OpenApi.make(api);

  expect(openApi.paths["/my-operation"].put?.description).toEqual(
    "my description",
  );
});

test("reference and schema component", () => {
  const responseSchema = pipe(
    Schema.struct({ someString: Schema.string }),
    Schema.identifier("ResponseSchema"),
  );
  const api = pipe(
    Api.api(),
    Api.put(
      "myOperation",
      "/my-operation",
      { response: responseSchema },
      { description: "my description" },
    ),
  );

  const openApi = OpenApi.make(api);
  expect(openApi).toStrictEqual({
    openapi: "3.0.3",
    info: {
      title: "Api",
      version: "1.0.0",
    },
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
                    $ref: "#/components/schemas/ResponseSchema",
                  },
                },
              },
              description: "Response",
            },
          },
          description: "my description",
        },
      },
    },
    components: {
      schemas: {
        ResponseSchema: {
          type: "object",
          properties: {
            someString: {
              type: "string",
              description: "a string",
            },
          },
          required: ["someString"],
        },
      },
    },
  });
});

test("full info object", () => {
  const api = Api.api({
    title: "My awesome pets API",
    version: "1.0.0",
    description: "my description",
    license: { name: "MIT" },
  });

  expect(OpenApi.make(api)).toEqual({
    openapi: "3.0.3",
    info: {
      title: "My awesome pets API",
      version: "1.0.0",
      description: "my description",
      license: { name: "MIT" },
    },
    paths: {},
  });
});
