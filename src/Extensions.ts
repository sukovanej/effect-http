/**
 * Mechanism for extendning behaviour of all handlers on the server.
 *
 * @since 1.0.0
 */
import * as crypto from "crypto";

import { pipe } from "@effect/data/Function";
import * as HashMap from "@effect/data/HashMap";
import * as Effect from "@effect/io/Effect";
import * as FiberRef from "@effect/io/FiberRef";
import * as Metric from "@effect/io/Metric";

import type { ApiError } from "./ServerError";

/**
 * Effect running before handlers.
 *
 * @category models
 * @since 1.0.0
 */
export type BeforeHandlerExtension<R> = {
  _tag: "BeforeHandlerExtension";
  id: string;
  fn: (request: Request) => Effect.Effect<R, ApiError, unknown>;
};

/**
 * Effect running after handlers.
 *
 * @category models
 * @since 1.0.0
 */
export type AfterHandlerExtension<R> = {
  _tag: "AfterHandlerExtension";
  id: string;
  fn: (
    request: Request,
    response: Response,
  ) => Effect.Effect<R, ApiError, unknown>;
};

/**
 * Effects applied for all requests. Safer variant of middlewares.
 *
 * @category models
 * @since 1.0.0
 */
export type Extension<R> = BeforeHandlerExtension<R> | AfterHandlerExtension<R>;

/**
 * Create an extension which runs an effect before each endpoint handler.
 *
 * @category constructors
 * @since 1.0.0
 */
export const beforeHandlerExtension = <R>(
  id: string,
  fn: BeforeHandlerExtension<R>["fn"],
): BeforeHandlerExtension<R> => ({ _tag: "BeforeHandlerExtension", id, fn });

/**
 * Create an extension which runs an effect after each successful endpoint handler.
 *
 * @category constructors
 * @since 1.0.0
 */
export const afterHandlerExtension = <R>(
  id: string,
  fn: AfterHandlerExtension<R>["fn"],
): AfterHandlerExtension<R> => ({ _tag: "AfterHandlerExtension", id, fn });

/**
 * Add access logs for handled requests. The log runs before each request.
 * Optionally configure log level using the first argument. The default log level
 * is `Debug`.
 *
 * @category extensions
 * @since 1.0.0
 */
export const accessLogExtension = (
  level: "Info" | "Warning" | "Debug" = "Info",
): BeforeHandlerExtension<never> =>
  beforeHandlerExtension("access-log", (request) =>
    Effect[`log${level}`](`${request.method} ${request.url}`),
  );

/**
 * Annotate request logs using generated UUID. The default annotation key is `requestId`.
 * The annotation key is configurable using the first argument.
 *
 * Note that in order to apply the annotation also for access logging, you should
 * make sure the `access-log` extension run after the `uuid-log-annotation`. Try
 * using `Http.prependExtension(Http.uuidLogAnnotationExtension())` if you don't
 * see the `requestId` log annotation in your access logs.
 *
 * @category extensions
 * @since 1.0.0
 */
export const uuidLogAnnotationExtension = (
  logAnnotationKey = "requestId",
): BeforeHandlerExtension<never> =>
  beforeHandlerExtension("uuid-log-annotation", () =>
    pipe(
      Effect.sync(() => crypto.randomUUID()),
      Effect.flatMap((uuid) =>
        FiberRef.update(
          FiberRef.currentLogAnnotations,
          HashMap.set<string, string>(logAnnotationKey, uuid),
        ),
      ),
    ),
  );

/**
 * Measure how many times each endpoint was called in a
 * `server.endpoint_calls` counter metrics.
 *
 * @category extensions
 * @since 1.0.0
 */
export const endpointCallsMetricExtension =
  (): BeforeHandlerExtension<never> => {
    const endpointCalledCounter = Metric.counter("server.endpoint_calls");

    return beforeHandlerExtension("endpoint-calls-metric", (request) => {
      const url = new URL(request.url);

      return pipe(
        Metric.increment(endpointCalledCounter),
        Effect.tagged("path", url.pathname),
      );
    });
  };
