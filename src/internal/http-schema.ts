import * as AST from "@effect/schema/AST";
import * as Schema from "@effect/schema/Schema";
import * as Effect from "effect/Effect";
import type * as HttpSchema from "effect-http/HttpSchema";
import * as Option from "effect/Option";

// content type

export const ContentTypeAnnotationId = Symbol.for(
  "effect-http/HttpSchema/ContentTypeAnnotationId",
);

export const contentType =
  (value: string) =>
  <I, A>(self: Schema.Schema<I, A>): Schema.Schema<I, A> =>
    Schema.make(AST.setAnnotation(self.ast, ContentTypeAnnotationId, value));

export const getContentTypeAnnotation = <I, A>(
  self: Schema.Schema<I, A>,
): Option.Option<string> =>
  AST.getAnnotation(ContentTypeAnnotationId)(self.ast) as Option.Option<string>;

// content encoder

export const ContentCodecAnnotationId = Symbol.for(
  "effect-http/HttpSchema/ContentCodecAnnotationId",
);

export const contentCodec =
  <I>(value: HttpSchema.ContentCodec<I>) =>
  <A>(self: Schema.Schema<I, A>) =>
    Schema.make<I, A>(
      AST.setAnnotation(self.ast, ContentCodecAnnotationId, value),
    );

export const getContentCodecAnnotation = <I, A>(self: Schema.Schema<I, A>) =>
  AST.getAnnotation(ContentCodecAnnotationId)(self.ast) as Option.Option<
    HttpSchema.ContentCodec<I>
  >;

export const jsonContentCodec = {
  encode: (i: unknown) => Effect.try(() => JSON.stringify(i)),
  decode: (i: string) => Effect.try(() => JSON.parse(i)),
} as const;

export const plainTextContentCodec = {
  encode: Effect.succeed<string>,
  decode: Effect.succeed<string>,
};

export const plainText = <A>(self: Schema.Schema<string, A>) =>
  self.pipe(contentType("text/plain"), contentCodec(plainTextContentCodec));

export const PlainText = plainText(Schema.string);


export const formDataSchema = Schema.instanceOf(FormData).pipe(
  Schema.jsonSchema({ type: "string" }),
  Schema.description("Multipart form data"),
);
