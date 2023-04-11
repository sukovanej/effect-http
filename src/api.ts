import express from "express";
import { AddressInfo } from "net";
import * as OpenApi from "schema-openapi";
import swaggerUi from "swagger-ui-express";

import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import { Layer } from "@effect/io/Layer";

import { ApiError } from "./errors";
import {
  createSpec,
  fillDefaultSchemas,
  handlerToRoute,
  toEndpoint,
} from "./internal";
import {
  AnyHandler,
  AnyInputHandlerSchemas,
  Api,
  ComputeHandler,
  ComputeInputHandler,
} from "./types";

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

export const handler =
  (method: OpenApi.OpenAPISpecMethodName) =>
  <I extends AnyInputHandlerSchemas, R>(
    path: string,
    schemas: I,
    handler: ComputeInputHandler<I, R>,
  ): ComputeHandler<I, R> => {
    const filledSchemas = fillDefaultSchemas(schemas);
    return {
      handler: toEndpoint(method, path, handler, filledSchemas),
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
    inputHandler: ComputeInputHandler<I, R1>,
  ) =>
  <R>(self: Api<R>): Api<R | R1> =>
    pipe(self, use(handler(method)(path, schemas, inputHandler)));

export const get = handler("get");
export const post = handler("post");
export const put = handler("put");
export const head = handler("head");
export const patch = handler("patch");
export const trace = handler("trace");
export const _delete = handler("delete");
export { _delete as delete };
export const options = handler("options");

export const useGet = useHandler("get");
export const usePost = useHandler("post");
export const usePut = useHandler("put");
export const useHead = useHandler("head");
export const usePatch = useHandler("patch");
export const useTrace = useHandler("trace");
export const useDelete = useHandler("delete");
export const useOptions = useHandler("options");

export const provideLayer =
  <R0, R>(layer: Layer<R0, ApiError, R>) =>
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

export const toExpress = (self: Api<never>): express.Express => {
  const app = express();
  app.use(express.json());

  for (const handler of self.handlers) {
    app.use(handlerToRoute(handler));
  }

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(createSpec(self)));

  return app;
};

export const listen = (port: number) => (self: Api<never>) => {
  const server = toExpress(self);

  return Effect.tryPromise(
    () =>
      new Promise<AddressInfo>((resolve, reject) => {
        const listeningServer = server.listen(port);
        listeningServer.on("listening", () =>
          resolve(listeningServer.address() as AddressInfo),
        );
        listeningServer.on("error", reject);
      }),
  );
};
