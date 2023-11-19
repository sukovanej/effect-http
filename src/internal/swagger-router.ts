/**
 * Create a router serving Swagger files.
 *
 * @since 1.0.0
 */
import * as FileSystem from "@effect/platform/FileSystem";
import * as Router from "@effect/platform/Http/Router";
import * as ServerResponse from "@effect/platform/Http/ServerResponse";
import * as Path from "@effect/platform/Path";
import type * as SwaggerRouter from "effect-http/SwaggerRouter";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Layer from "effect/Layer";
import * as ReadonlyRecord from "effect/ReadonlyRecord";

export const TypeId: SwaggerRouter.TypeId = Symbol.for(
  "effect-http/SwaggerRouter/TypeId",
) as SwaggerRouter.TypeId;

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
  Effect.flatMap(FileSystem.FileSystem, (fs) =>
    fs.readFileString(path, "utf-8"),
  );

const SWAGGER_FILE_NAMES = [
  "index.html",
  "index.css",
  "swagger-ui.css",
  "swagger-ui-bundle.js",
  "swagger-ui-standalone-preset.js",
  "favicon-32x32.png",
  "favicon-16x16.png",
];

/** @internal */
const readSwaggerFile = (swaggerBasePath: string, file: string) =>
  Effect.flatMap(Path.Path, (path) =>
    readFile(path.resolve(swaggerBasePath, file)).pipe(Effect.orDie),
  );

/** @internal */
export const SwaggerFiles = Context.Tag<SwaggerRouter.SwaggerFiles>();

/** @internal */
export const SwaggerFilesLive = Effect.gen(function* (_) {
  const { getAbsoluteFSPath } = yield* _(
    Effect.promise(() => import("swagger-ui-dist")),
  );

  const absolutePath = getAbsoluteFSPath();

  const files = yield* _(
    SWAGGER_FILE_NAMES,
    Effect.forEach((path) =>
      Effect.zip(Effect.succeed(path), readSwaggerFile(absolutePath, path)),
    ),
    Effect.map(ReadonlyRecord.fromEntries),
  );

  const size = Object.entries(files).reduce(
    (acc, [_, content]) => acc + content.length,
    0,
  );
  const sizeMb = (size / 1024 / 1024).toFixed(1);

  yield* _(Effect.logDebug(`Static swagger UI files loaded (${sizeMb}MB)`));

  return { [TypeId]: TypeId, files } as SwaggerRouter.SwaggerFiles;
}).pipe(Layer.effect(SwaggerFiles));

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
      const { files } = yield* _(SwaggerFiles);
      const content = files[filename];

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
    Router.empty as Router.Router<SwaggerRouter.SwaggerFiles, never>,
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
