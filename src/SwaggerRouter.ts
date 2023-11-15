/**
 * Create a router serving Swagger files.
 *
 * @since 1.0.0
 */
import fs from "fs";
import path from "path";
import { getAbsoluteFSPath } from "swagger-ui-dist";

import * as Router from "@effect/platform/Http/Router";
import * as ServerResponse from "@effect/platform/Http/ServerResponse";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as ReadonlyRecord from "effect/ReadonlyRecord";

/** @internal */
const createSwaggerInitializer = (path: string) => `
window.onload = function() {
  window.ui = SwaggerUIBundle({
    url: "${path}",
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  });
};
`;

/** @internal */
const readFile = (path: string) =>
  Effect.async<never, never, string>((cb) =>
    fs.readFile(path, "utf-8", (error, buffer) => {
      if (error) {
        cb(Effect.die(error));
      } else {
        cb(Effect.succeed(buffer));
      }
    }),
  );

/** @internal */
const swaggerBasePath = getAbsoluteFSPath();

/** @internal */
const readSwaggerFile = (file: string) =>
  readFile(path.join(swaggerBasePath, file)).pipe(Effect.orDie);

const SWAGGER_FILE_NAMES = [
  "index.html",
  "index.css",
  "swagger-ui.css",
  "swagger-ui-bundle.js",
  "swagger-ui-standalone-preset.js",
  "favicon-32x32.png",
  "favicon-16x16.png",
];

/**
 * @category models
 * @since 1.0.0
 */
export type SwaggerFiles = Record<string, string>;

/**
 * @category context
 * @since 1.0.0
 */
export const SwaggerFiles = Context.Tag<SwaggerFiles>();

/**
 * @category context
 * @since 1.0.0
 */
export const SwaggerFilesLive = pipe(
  SWAGGER_FILE_NAMES,
  Effect.forEach((path) =>
    Effect.zip(Effect.succeed(path), readSwaggerFile(path)),
  ),
  Effect.tap((files) => {
    const size = files.reduce((acc, [_, content]) => acc + content.length, 0);
    const sizeMb = (size / 1024 / 1024).toFixed(1);

    return Effect.logDebug(`Static swagger UI files loaded (${sizeMb}MB)`);
  }),
  Effect.map(ReadonlyRecord.fromEntries),
  Layer.effect(SwaggerFiles),
);

/** @internal */
const createHeaders = (file: string) => {
  if (file.endsWith(".html")) {
    return { "content-type": "text/html" };
  } else if (file.endsWith(".css")) {
    return { "content-type": "text/css" };
  } else if (file.endsWith(".js")) {
    return { "content-type": "application/javascript" };
  } else if (file.endsWith(".png")) {
    return { "content-type": "image/png" };
  }

  return undefined;
};

/** @internal */
const serverStaticDocsFile = (filename: string) => {
  const headers = createHeaders(filename);

  return Router.get(
    `/docs/${filename}`,
    Effect.gen(function* (_) {
      const swaggerFiles = yield* _(SwaggerFiles);
      const content = swaggerFiles[filename];

      return ServerResponse.text(content, { ...(headers && { headers }) });
    }),
  );
};

/** @internal */
const redirect = (location: string) =>
  ServerResponse.empty({ status: 301, headers: { location } });

/**
 * @category constructors
 * @since 1.0.0
 */
export const make = (spec: unknown) => {
  const openApiJsonPath = "/docs/openapi.json";

  let router = SWAGGER_FILE_NAMES.reduce(
    (router, swaggerFileName) =>
      router.pipe(serverStaticDocsFile(swaggerFileName)),
    Router.empty as Router.Router<SwaggerFiles, never>,
  );

  const swaggerInitialiser = createSwaggerInitializer(openApiJsonPath);

  router = router.pipe(
    Router.get("/docs", redirect("/docs/index.html")),
    Router.get(openApiJsonPath, pipe(ServerResponse.json(spec), Effect.orDie)),
    Router.get(
      `/docs/swagger-initializer.js`,
      ServerResponse.text(swaggerInitialiser, {
        headers: { "content-type": "application/javascript" },
      }),
    ),
  );

  return router;
};
