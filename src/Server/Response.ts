export const ResponseId = Symbol("effect-http/Server/ResponseId");
export type ResponseId = typeof ResponseId;

export type Response<
  Body = any,
  StatusCode extends number | undefined = number | undefined,
  Headers extends Record<string, string> | undefined =
    | Record<string, string>
    | undefined,
> = {
  readonly [ResponseId]: ResponseId;

  body: Body;
  headers?: Headers;
  statusCode?: StatusCode;
};

export const response = <S extends Omit<Response, ResponseId>>(
  response: S,
): Response<
  S["body"],
  S["statusCode"] extends number ? S["statusCode"] : undefined,
  S["headers"] extends Record<string, string> ? S["headers"] : undefined
> => ({
  [ResponseId]: ResponseId,
  headers: undefined,
  statusCode: undefined,
  ...response,
});

export const toResponse = <Body>(
  body: Body,
): Response<Body, undefined, undefined> =>
  response({
    body,
    headers: undefined,
    statusCode: undefined,
  });

export const setStatusCode =
  <StatusCode extends number>(statusCode: StatusCode) =>
  <Body, Headers extends Record<string, string> | undefined>(
    response: Response<Body, number | undefined, Headers>,
  ): Response<Body, StatusCode, Headers> => ({
    ...response,
    statusCode,
  });

export const setHeaders =
  <Headers extends Record<string, string>>(headers: Headers) =>
  <Body, StatusCode extends number | undefined>(
    response: Response<Body, StatusCode, Headers>,
  ): Response<Body, StatusCode, Headers> => ({
    ...response,
    headers,
  });

export const isResponse = (obj: unknown): obj is Response<unknown> =>
  typeof obj === "object" && obj !== null && ResponseId in obj;
