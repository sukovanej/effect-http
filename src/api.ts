import express from 'express';
import { AddressInfo } from 'net';
import swaggerUi from 'swagger-ui-express';
import * as OpenApi from 'schema-openapi';

import * as Context from '@effect/data/Context';
import { flow, pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';
import { Layer } from '@effect/io/Layer';
import * as S from '@effect/schema/Schema';

import {
  AnyHandler,
  AnyHandlerError,
  AnyInputHandlerSchemas,
  Api,
  ApiError,
  ComputeHandler,
  ComputeHandlerSchemas,
  ComputeInputHandler,
  FinalHandler,
  HandlerSchemas,
  InputHandler,
  InvalidBodyError,
  InvalidParamsError,
  InvalidQueryError,
  InvalidResponseError,
  NotFoundError,
  ServerError,
  UnexpectedServerError,
} from './types';

export const make = (title: string, version: string): Api<never> => ({
  openApiSpec: OpenApi.openAPI(title, version),
  handlers: [],
});

export const use =
  <R2>(handler: AnyHandler<R2>) =>
  <R1>(self: Api<R1>): Api<R1 | R2> => ({
    ...self,
    handlers: [...self.handlers, handler],
  });

const _fillDefaultSchemas = <I extends AnyInputHandlerSchemas>({
  response,
  query,
  params,
  body,
}: I): ComputeHandlerSchemas<I> => ({
  response,
  query: query ?? (S.unknown as ComputeHandlerSchemas<I>['query']),
  params: params ?? (S.unknown as ComputeHandlerSchemas<I>['params']),
  body: body ?? (S.unknown as ComputeHandlerSchemas<I>['body']),
});

export const handler =
  (method: OpenApi.OpenAPISpecMethodName) =>
  <I extends AnyInputHandlerSchemas, R>(
    path: string,
    schemas: I,
    handler: ComputeInputHandler<I, R>
  ): ComputeHandler<I, R> => {
    const filledSchemas = _fillDefaultSchemas(schemas);
    return {
      handler: _toEndpoint(method, path, handler, filledSchemas),
      schemas: filledSchemas,
      method,
      path,
    };
  };

export const useHandler =
  (method: OpenApi.OpenAPISpecMethodName) =>
  <I extends AnyInputHandlerSchemas, R1>(
    path: string,
    schemas: I,
    inputHandler: ComputeInputHandler<I, R1>
  ) =>
  <R>(self: Api<R>): Api<R | R1> =>
    pipe(self, use(handler(method)(path, schemas, inputHandler)));

export const get = handler('get');
export const post = handler('post');
export const put = handler('put');
export const head = handler('head');
export const patch = handler('patch');
export const trace = handler('trace');
export const _delete = handler('delete');
export { _delete as delete };
export const options = handler('options');

export const useGet = useHandler('get');
export const usePost = useHandler('post');
export const usePut = useHandler('put');
export const useHead = useHandler('head');
export const usePatch = useHandler('patch');
export const useTrace = useHandler('trace');
export const useDelete = useHandler('delete');
export const useOptions = useHandler('options');

// Services

export const provideLayer =
  <R0, R>(layer: Layer<R0, AnyHandlerError, R>) =>
  (api: Api<R>): Api<R0> => ({
    ...api,
    handlers: api.handlers.map((handler) => ({
      ...handler,
      handler: (req, res) =>
        pipe(handler.handler(req, res), Effect.provideLayer(layer)),
    })),
  });

export const provideService =
  <T extends Context.Tag<any, any>>(tag: T, service: Context.Tag.Service<T>) =>
  <R>(api: Api<R>): Api<Exclude<R, Context.Tag.Identifier<T>>> => ({
    ...api,
    handlers: api.handlers.map((handler) => ({
      ...handler,
      handler: (req, res) =>
        pipe(handler.handler(req, res), Effect.provideService(tag, service)),
    })),
  });

// Errors

export const notFoundError = (error: unknown): NotFoundError =>
  ({ _tag: 'NotFoundError', error } as const);

export const serverError = (error: unknown): ServerError =>
  ({ _tag: 'ServerError', error } as const);

const invalidQueryError = (error: unknown): InvalidQueryError => ({
  _tag: 'InvalidQueryError',
  error,
});

const invalidParamsError = (error: unknown): InvalidParamsError => ({
  _tag: 'InvalidParamsError',
  error,
});

const invalidBodyError = (error: unknown): InvalidBodyError => ({
  _tag: 'InvalidBodyError',
  error,
});

const invalidResponseError = (error: unknown): InvalidResponseError => ({
  _tag: 'InvalidResponseError',
  error,
});

const unexpectedServerError = (error: unknown): UnexpectedServerError => ({
  _tag: 'UnexpectedServerError',
  error,
});

// Impl

const handleApiFailure = (
  method: OpenApi.OpenAPISpecMethodName,
  path: string,
  error: ApiError,
  statusCode: number,
  res: express.Response
) =>
  pipe(
    Effect.logWarning(`${method} ${path} failed`),
    Effect.logAnnotate('errorTag', error._tag),
    Effect.logAnnotate('error', JSON.stringify(error.error, undefined)),
    Effect.flatMap(() =>
      Effect.try(() =>
        res.status(statusCode).send({
          error: error._tag,
          details: JSON.stringify(error.error, undefined),
        })
      )
    ),
    Effect.ignoreLogged
  );

const _toEndpoint = <Query, Params, Body, Response, R>(
  method: OpenApi.OpenAPISpecMethodName,
  path: string,
  handler: InputHandler<Query, Params, Body, Response, R>,
  schemas: HandlerSchemas<Query, Params, Body, Response>
): FinalHandler<R> => {
  const parseQuery = S.parseEffect(schemas.query);
  const parseParams = S.parseEffect(schemas.params);
  const parseBody = S.parseEffect(schemas.body);
  const encodeResponse = S.parseEffect(schemas.response);

  return (req: express.Request, res: express.Response) =>
    pipe(
      Effect.Do(),
      Effect.bind('query', () =>
        pipe(parseQuery(req.query), Effect.mapError(invalidQueryError))
      ),
      Effect.bind('params', () =>
        pipe(parseParams(req.params), Effect.mapError(invalidParamsError))
      ),
      Effect.bind('body', () =>
        pipe(parseBody(req.body), Effect.mapError(invalidBodyError))
      ),
      Effect.flatMap(handler),
      Effect.flatMap(
        flow(encodeResponse, Effect.mapError(invalidResponseError))
      ),
      Effect.flatMap((response) =>
        pipe(
          Effect.try(() => {
            res.status(200).send(response);
          }),
          Effect.mapError(unexpectedServerError)
        )
      ),
      Effect.catchTags({
        InvalidBodyError: (error) =>
          handleApiFailure(method, path, error, 400, res),
        InvalidQueryError: (error) =>
          handleApiFailure(method, path, error, 400, res),
        InvalidParamsError: (error) =>
          handleApiFailure(method, path, error, 400, res),
        InvalidResponseError: (error) =>
          handleApiFailure(method, path, error, 500, res),
        UnexpectedServerError: (error) =>
          handleApiFailure(method, path, error, 500, res),
        NotFoundError: (error) =>
          handleApiFailure(method, path, error, 404, res),
        ServerError: (error) => handleApiFailure(method, path, error, 500, res),
      })
    );
};

const _handlerToRoute = (handler: AnyHandler<never>) =>
  express
    .Router()
    [handler.method](handler.path, (req, res) =>
      Effect.runPromise(handler.handler(req, res))
    );

const _createSpec = (self: Api<never>): OpenApi.OpenAPISpec<OpenApi.OpenAPISchemaType> => {
  return self.handlers.reduce((spec, { path, method, schemas }) => {
    const operationSpec = [];

    if (schemas.response !== S.unknown) {
      operationSpec.push(
        OpenApi.jsonResponse(200, schemas.response, 'Response')
      );
    }

    if (schemas.params !== S.unknown) {
      operationSpec.push(
        OpenApi.parameter('Path parameter', 'path', schemas.params)
      );
    }

    if (schemas.query !== S.unknown) {
      operationSpec.push(
        OpenApi.parameter('Query parameter', 'query', schemas.query)
      );
    }

    if (schemas.body !== S.unknown) {
      operationSpec.push(OpenApi.jsonRequest(schemas.body));
    }

    return OpenApi.path(
      path,
      OpenApi.operation(method, ...operationSpec)
    )(spec);
  }, self.openApiSpec);
};

// Compilers

export const toExpress = (self: Api<never>): express.Express => {
  const app = express();
  app.use(express.json());

  for (const handler of self.handlers) {
    app.use(_handlerToRoute(handler));
  }

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(_createSpec(self)));

  return app;
};

export const listen = (port: number) => (self: Api<never>) => {
  const server = toExpress(self);

  return Effect.tryPromise(
    () =>
      new Promise<AddressInfo>((resolve, reject) => {
        const listeningServer = server.listen(port);
        listeningServer.on('listening', () =>
          resolve(listeningServer.address() as AddressInfo)
        );
        listeningServer.on('error', reject);
      })
  );
};
