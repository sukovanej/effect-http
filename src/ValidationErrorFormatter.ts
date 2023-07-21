/**
 * This module gives the client code using the `effect-http` to modify
 * how validation errors are formatted when returned the server.
 *
 * @since 1.0.0
 */
import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import { isRecord } from "@effect/data/Predicate";
import * as RA from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as AST from "@effect/schema/AST";
import { ParseError, ParseErrors } from "@effect/schema/ParseResult";

/**
 * @category models
 * @since 1.0.0
 */
export interface ValidationErrorFormatter {
  (error: ParseError): string;
}

/**
 * @category context tags
 * @since 1.0.0
 */
export const ValidationErrorFormatterService =
  Context.Tag<ValidationErrorFormatter>();

/**
 * @category refinements
 * @since 1.0.0
 */
export const isParseError = (error: unknown): error is ParseError =>
  isRecord(error) && "_tag" in error && error._tag === "ParseError";

/**
 * @category combinators
 * @since 1.0.0
 */
export const defaultValidationErrorFormatterServer: ValidationErrorFormatter = (
  error: ParseError,
): string => {
  const errors = error.errors.flatMap(formatParseErrors);

  if (errors.length === 1) {
    return stringifyError(errors[0]);
  } else if (allEqualUpToExpected(errors)) {
    const expected = (errors as ValidationErrorUnexpected[]).flatMap(
      (e) => e.expected,
    );
    return stringifyError({ ...errors[0], expected });
  }

  return JSON.stringify(error);
};

/** @internal */
const allEqualUpToExpected = (
  errors: readonly ValidationError[],
): errors is readonly ValidationErrorUnexpected[] =>
  RA.reduce(errors, true, () => true);

/** @internal */
const stringifyError = (error: ValidationError) => {
  if (error.message) {
    return error.message;
  }

  if (error._tag === "Missing") {
    return `${error.position} is missing`;
  }

  const position = error.position.join(".");

  const expected = error.expected.join(" or ");
  const expectedBefore = error.expected.length > 1 ? "one of " : "";

  const received = JSON.stringify(error.received);

  return `${position} must be ${expectedBefore}${expected}, got ${received}`;
};

/** @ignore */
type ValidationError = {
  position: string[];
  message?: string;
} & (
  | { _tag: "Missing" }
  | { _tag: "Unexpected"; expected: string[]; received: unknown }
);

/** @ignore */
type ValidationErrorUnexpected = Extract<
  ValidationError,
  { _tag: "Unexpected" }
>;

/** @internal */
const formatParseErrors = (errors: ParseErrors): readonly ValidationError[] => {
  if (errors._tag === "Key") {
    return errors.errors.flatMap((error) =>
      formatParseErrors(error).map((e) => ({
        ...e,
        position: [errors.key.toString(), ...e.position],
      })),
    );
  } else if (errors._tag === "Type") {
    return [
      {
        _tag: "Unexpected",
        expected: [formatAST(errors.expected)],
        message: Option.getOrUndefined(errors.message),
        received: errors.actual,
        position: [],
      },
    ];
  } else if (errors._tag === "Missing") {
    return [{ _tag: "Missing", position: [] }];
  } else if (errors._tag === "Index") {
    return errors.errors.flatMap((error) =>
      formatParseErrors(error).map((e) => ({
        ...e,
        position: [`[${errors.index}]`, ...e.position],
      })),
    );
  } else if (errors._tag === "UnionMember") {
    return errors.errors.flatMap(formatParseErrors);
  }

  throw new Error(`Unhandled error case ${JSON.stringify(errors)}`);
};

/** @internal */
const formatAST = (ast: AST.AST) => {
  const description = AST.getAnnotation(AST.DescriptionAnnotationId)(ast);

  if (Option.isSome(description)) {
    return description.value as string;
  }

  if (ast._tag === "StringKeyword") {
    return "<string>";
  } else if (ast._tag === "NumberKeyword") {
    return "<number>";
  } else if (ast._tag === "Literal") {
    return JSON.stringify(ast.literal);
  }

  return JSON.stringify(ast);
};

/**
 * @category combinators
 * @since 1.0.0
 */
export const setValidationErrorFormatter = (
  formatter: ValidationErrorFormatter,
) => Layer.succeed(ValidationErrorFormatterService, formatter);

/**
 * @category combinators
 * @since 1.0.0
 */
export const formatValidationError = (
  error: ParseError,
): Effect.Effect<never, never, string> =>
  pipe(
    Effect.contextWith((context: Context.Context<never>) =>
      pipe(
        context,
        Context.getOption(ValidationErrorFormatterService),
        Option.getOrElse(() => defaultValidationErrorFormatterServer),
      ),
    ),
    Effect.map((formatter) => formatter(error)),
  );
