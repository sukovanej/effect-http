import { Schema } from "@effect/schema";
import { pipe } from "effect";
import * as Http from "effect-http";
import { Api } from "effect-http";

test("response helpers", () => {
  const api = pipe(
    Api.api(),
    Api.post("doSutff", "/do-stuff", { response: Schema.string }),
    Api.post("createSomething", "/create-something", {
      response: [
        {
          status: 201,
          content: Schema.number,
        },
        {
          status: 200,
        },
      ],
      request: {
        query: Schema.struct({
          value: Schema.NumberFromString,
        }),
      },
    }),
    Api.post("hello", "/hello", {
      response: [
        {
          status: 201,
          content: Schema.number,
        },
        {
          status: 200,
          content: Schema.number,
          headers: Schema.struct({ "X-Another-200": Schema.NumberFromString }),
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
    Api.post("another", "/another", {
      response: {
        status: 200,
        content: Schema.string,
      },
    }),
  );

  const DoStuffResponseUtil = Http.responseUtil(
    Api.getEndpoint(api, "doSutff"),
  );
  const HelloResponseUtil = Http.responseUtil(Api.getEndpoint(api, "hello"));
  const CreateSomethingResponseUtil = Http.responseUtil(
    Api.getEndpoint(api, "createSomething"),
  );
  const AnotherResponseUtil = Http.responseUtil(
    Api.getEndpoint(api, "another"),
  );

  expect(
    HelloResponseUtil.response204({ headers: { "x-another": 12 } }),
  ).toEqual({
    headers: { "x-another": 12 },
    status: 204,
  });
  expect(HelloResponseUtil.response201({ content: 69 })).toEqual({
    content: 69,
    status: 201,
  });
  expect(
    HelloResponseUtil.response200({
      content: 12,
      headers: { "x-another-200": 69 },
    }),
  ).toEqual({ content: 12, headers: { "x-another-200": 69 }, status: 200 });

  expect(CreateSomethingResponseUtil.response200({})).toEqual({ status: 200 });
  expect(CreateSomethingResponseUtil.response201({ content: 69 })).toEqual({
    status: 201,
    content: 69,
  });

  expect(AnotherResponseUtil.response200({ content: "patrik" })).toEqual({
    status: 200,
    content: "patrik",
  });

  // @ts-expect-error 202 status doesn't exist
  expect(HelloResponseUtil.response202).toBeUndefined;

  // @ts-expect-error do stuff doesn't have multiple responses
  expect(DoStuffResponseUtil.response200).toBeUndefined;
});
