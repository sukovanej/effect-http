/**
 * HTTP-specific `@effect/schema` annotations and schemas.
 *
 * @since 1.0.0
 */
import type * as Schema from "@effect/schema/Schema";
import * as internal from "effect-http/internal/http-schema";
import type * as Effect from "effect/Effect";
import type * as Option from "effect/Option";

/**
 * @category content type
 * @since 1.0.0
 */
export const ContentTypeAnnotationId = internal.ContentTypeAnnotationId;

/**
 * @category content type
 * @since 1.0.0
 */
export const contentType: (
  value: string,
) => <I, A>(self: Schema.Schema<I, A>) => Schema.Schema<I, A> =
  internal.contentType;

/**
 * @category content type
 * @since 1.0.0
 */
export const getContentTypeAnnotation: <I, A>(
  self: Schema.Schema<I, A>,
) => Option.Option<string> = internal.getContentTypeAnnotation;

/**
 * @category content codec
 * @since 1.0.0
 */
export interface ContentCodec<I> {
  encode: (i: I) => Effect.Effect<never, Error, string>;
  decode: (i: string) => Effect.Effect<never, Error, I>;
}

/**
 * @category content codec
 * @since 1.0.0
 */
export const ContentCodecAnnotationId = internal.ContentCodecAnnotationId;

/**
 * @category content codec
 * @since 1.0.0
 */
export const contentCodec: <I>(
  value: ContentCodec<I>,
) => <A>(self: Schema.Schema<I, A>) => Schema.Schema<I, A> =
  internal.contentCodec;

/**
 * @category content codec
 * @since 1.0.0
 */
export const getContentCodecAnnotation: <I, A>(
  self: Schema.Schema<I, A>,
) => Option.Option<ContentCodec<I>> = internal.getContentCodecAnnotation;

/**
 * @category content codec
 * @since 1.0.0
 */
export const jsonContentCodec: ContentCodec<unknown> =
  internal.jsonContentCodec;

/**
 * @category content codec
 * @since 1.0.0
 */
export const plainTextContentCodec: ContentCodec<string> =
  internal.plainTextContentCodec;

/**
 * @category combinators
 * @since 1.0.0
 */
export const plainText: <A>(
  self: Schema.Schema<string, A>,
) => Schema.Schema<string, A> = internal.plainText;

/**
 * @category schemas
 * @since 1.0.0
 */
export const PlainText: Schema.Schema<string, string> = internal.PlainText;

/**
 * @category schemas
 * @since 1.0.0
 */
export const FormData: Schema.Schema<FormData> = internal.formDataSchema;
