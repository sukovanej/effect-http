import * as AST from "@effect/schema/AST";
import * as ParseResult from "@effect/schema/ParseResult";
import * as Equivalence from "effect/Equivalence";
import * as Option from "effect/Option";
import * as Order from "effect/Order";
import * as ReadonlyArray from "effect/ReadonlyArray";
import { pipe } from "effect/Function";

const getDescription = AST.getAnnotation<AST.DescriptionAnnotation>(
  AST.DescriptionAnnotationId,
);

const getTitle = AST.getAnnotation<AST.TitleAnnotation>(AST.TitleAnnotationId);

const getMessage = AST.getAnnotation<AST.MessageAnnotation<unknown>>(
  AST.MessageAnnotationId,
);

const getIdentifier = AST.getAnnotation<AST.IdentifierAnnotation>(
  AST.IdentifierAnnotationId,
);

const getExpected = (ast: AST.AST): Option.Option<string> =>
  getIdentifier(ast).pipe(
    Option.orElse(() => getTitle(ast)),
    Option.orElse(() => getDescription(ast)),
  );

const stringifyExpected = (
  error: Exclude<ValidationError, { _tag: "Missing" }>,
) => {
  const expected = Option.all({
    init: ReadonlyArray.init(error.expected),
    last: ReadonlyArray.last(error.expected),
  }).pipe(
    Option.map(({ init, last }) =>
      init.length === 0 ? last : `${init.join(", ")} or ${last}`,
    ),
    Option.getOrElse(() => error.expected.join(" or ")),
  );

  return `${expected}`;
};

const stringifyError = (error: ValidationError) => {
  if (error.message) {
    return error.message;
  }

  const position =
    error.position.length > 0 ? error.position.join(".") + " " : "";

  if (error._tag === "Missing") {
    return `${position}is missing`;
  }

  const expected = stringifyExpected(error);
  const received = JSON.stringify(error.received);

  return `${position}must be ${expected}, received ${received}`;
};

type ValidationErrorBase = {
  position: string[];
  message?: string;
};
type ValidationErrorUnexpected = ValidationErrorBase & {
  _tag: "Unexpected";
  expected: string[];
  received: unknown;
};
type ValidationErrorMissing = ValidationErrorBase & { _tag: "Missing" };
type ValidationError = ValidationErrorUnexpected | ValidationErrorMissing;

const formatParseErrors = (errors: ParseResult.ParseErrors): readonly ValidationError[] => {
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
        expected: [
          getMessage(errors.expected).pipe(
            Option.map((f) => f(errors.actual)),
            Option.getOrElse(() => formatAST(errors.expected)),
          ),
        ],
        ...errors.message.pipe(
          Option.map((message) => ({ message })),
          Option.getOrUndefined,
        ),
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
  } else if (errors._tag === "Unexpected") {
    return [
      {
        _tag: "Unexpected",
        expected: [],
        position: [],
        received: errors.actual,
      },
    ];
  }

  return [
    {
      _tag: "Unexpected",
      expected: [],
      position: [],
      received: "<unexpected>",
    },
  ];
};

const formatAST = (ast: AST.AST) => {
  const expected = getExpected(ast);

  if (Option.isSome(expected)) {
    return expected.value as string;
  }

  if (ast._tag === "Literal") {
    return JSON.stringify(ast.literal);
  }

  return JSON.stringify(ast);
};

export const formatParseError = (error: ParseResult.ParseError): string => {
  const errors = ReadonlyArray.flatMap(error.errors, formatParseErrors);

  if (errors.length === 1) {
    return stringifyError(errors[0]);
  }

  if (!ReadonlyArray.isNonEmptyArray(errors)) {
    return `Unexpected validation errors: ${JSON.stringify(error)}`;
  }

  const errorsWithMostPrecisePosition = pipe(
    errors,
    ReadonlyArray.groupWith(
      pipe(
        Equivalence.array(Equivalence.string),
        Equivalence.mapInput((e: ValidationError) => e.position),
      ),
    ),
    ReadonlyArray.max((a, b) => {
      // use errors with the longest position
      const longestPositionOrdering = Order.number(
        a[0].position.length,
        b[0].position.length,
      );

      if (longestPositionOrdering !== 0) {
        return longestPositionOrdering;
      }

      // use errors with the greatest number of union cases
      const numberOfUnionMembersOrdering = Order.number(a.length, b.length);

      if (numberOfUnionMembersOrdering !== 0) {
        return numberOfUnionMembersOrdering;
      }

      const aContainsUnexpected = a.some((e) => e._tag === "Unexpected");
      const bContainsUnexpected = b.some((e) => e._tag === "Unexpected");

      // use errors with the greatest number of union cases
      if (aContainsUnexpected && !bContainsUnexpected) {
        return 1;
      } else if (!aContainsUnexpected && bContainsUnexpected) {
        return -1;
      }

      return 0;
    }),
  );

  const errorsByTag = pipe(
    errorsWithMostPrecisePosition,
    ReadonlyArray.groupBy((error) => error._tag),
  );

  if ("Unexpected" in errorsByTag) {
    const unexpectedErrors = errorsByTag[
      "Unexpected"
    ] as ValidationErrorUnexpected[];

    const expected = unexpectedErrors.flatMap((e) => e.expected);

    if (ReadonlyArray.isNonEmptyArray(unexpectedErrors)) {
      return stringifyError({ ...unexpectedErrors[0], expected });
    }
  }

  if ("Missing" in errorsByTag) {
    const unexpectedErrors = errorsByTag["Missing"] as ValidationErrorMissing[];

    if (ReadonlyArray.isNonEmptyArray(unexpectedErrors)) {
      return stringifyError(unexpectedErrors[0]);
    }
  }

  return `Unexpected validation errors: ${errors}`;
};
