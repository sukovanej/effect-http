import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";
import * as Http from "effect-http";

test("response helpers", () => {
  const api = pipe(
    Http.api(),
    Http.post("doSutff", "/do-stuff", { response: Schema.string }),
    Http.post("createSomething", "/create-something", {
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
    Http.post("hello", "/hello", {
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
    Http.post("another", "/another", {
      response: {
        status: 200,
        content: Schema.string,
      },
    }),
  );

  const DoStuffResponseUtil = Http.responseUtil(api, "doSutff");
  const HelloResponseUtil = Http.responseUtil(api, "hello");
  const CreateSomethingResponseUtil = Http.responseUtil(api, "createSomething");
  const AnotherResponseUtil = Http.responseUtil(api, "another");

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
