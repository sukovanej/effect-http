import * as Array from "effect/Array"
import * as Context from "effect/Context"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Ref from "effect/Ref"
import * as Schema from "effect/Schema"
import * as AST from "effect/SchemaAST"
import * as Unify from "effect/Unify"

/** @internal */
const getExampleValue = (ast: AST.Annotated) =>
  pipe(
    AST.getAnnotation<AST.ExamplesAnnotation<any>>(AST.ExamplesAnnotationId)(ast),
    Option.getOrUndefined
  )

/** @internal */
const getDescription = (ast: AST.Annotated) =>
  pipe(
    AST.getAnnotation<AST.DescriptionAnnotation>(AST.DescriptionAnnotationId)(
      ast
    ),
    Option.getOrUndefined
  )

/** @internal */
type IntegerCounter = Ref.Ref<number>

/** @internal */
const IntegerCounter = Context.GenericTag<IntegerCounter>(
  "effect-http/example_compiler/integer-counter"
)

/** @internal */
const nextInteger = Effect.flatMap(
  IntegerCounter,
  Ref.getAndUpdate((n) => n + 1)
)

/** @internal */
const randomChoice = <A>(
  xs: ReadonlyArray<A>
): Effect.Effect<A, RandomExampleError> =>
  pipe(
    Effect.randomWith((r) => r.nextIntBetween(0, xs.length)),
    Effect.filterOrFail(
      (i) => i >= 0,
      () => RandomExampleErrorImpl.make(`Can choose from ${xs}`)
    ),
    Effect.map((i) => xs[i])
  )

/** @internal */
export interface RandomExampleError {
  _tag: "RandomExampleError"
  error: string
}

/** @internal */
class RandomExampleErrorImpl extends Data.TaggedError("RandomExampleError")<{
  error: string
}> implements RandomExampleError {
  static make(error: string) {
    return new RandomExampleErrorImpl({ error })
  }
}

/** @internal */
export const randomExample = <To, From, R>(
  schema: Schema.Schema<To, From, R>
): Effect.Effect<To, RandomExampleError> => {
  const go = (
    ast: AST.AST,
    constraint: TypeConstraint<any> | undefined
  ): Effect.Effect<any, RandomExampleError, IntegerCounter> => {
    const exampleFromAnnotation = getExampleValue(ast)

    if (exampleFromAnnotation) {
      return randomChoice(exampleFromAnnotation)
    }

    switch (ast._tag) {
      case "Literal": {
        return Effect.succeed(ast.literal)
      }
      case "UnknownKeyword":
        return Effect.succeed(undefined)
      case "AnyKeyword":
        return randomChoice([{}, "hello-world", 69, undefined])
      case "StringKeyword":
        return randomChoice(["hello world", "patrik"])
      case "NumberKeyword":
        return Effect.map(nextInteger, (number) => {
          if (constraint) {
            return resolveConstrainedNumber(number, constraint)
          }
          return number
        })
      case "BooleanKeyword":
        return randomChoice([true, false])
      case "ObjectKeyword":
        return randomChoice([{ iam: "object" }])
      case "TupleType": {
        const generate = Effect.forEach((element: AST.AST) => go(element, undefined))

        const elements = generate(ast.elements.map((element) => element.type))

        const postRestElementsAst = pipe(
          Array.tail(ast.rest),
          Option.map((rest) => rest.map((e) => e.type)),
          Option.getOrElse(() => [] as Array<AST.AST>)
        )

        const nElements = ast.elements.length + postRestElementsAst.length

        const rest = pipe(
          Array.head(ast.rest),
          Option.map((rest) =>
            globalThis.Array(
              constraint?.min != null ? constraint.min - nElements : 1
            ).fill(rest.type)
          ),
          Option.map(generate),
          Option.getOrElse(() => Effect.succeed([] as Array<any>))
        )

        const postRestElements = generate(postRestElementsAst)

        return Effect.mergeAll(
          [elements, rest, postRestElements],
          [] as Array<any>,
          (a, b) => [...a, ...b]
        )
      }
      case "TypeLiteral": {
        if (
          ast.indexSignatures.length <
            ast.indexSignatures.filter(
              (is) => is.parameter._tag === "StringKeyword"
            ).length
        ) {
          return Effect.fail(
            RandomExampleErrorImpl.make(
              `Cannot create example for some index signatures`
            )
          )
        }

        const result = pipe(
          ast.propertySignatures,
          Effect.reduce({}, (acc, ps) =>
            Effect.map(go(ps.type, constraint), (v) => ({
              ...acc,
              [ps.name]: v
            })))
        )

        return result
      }
      case "Union": {
        return Effect.flatten(
          randomChoice(ast.types.map((ast) => go(ast, constraint)))
        )
      }
      case "Enums": {
        return randomChoice(ast.enums)
      }
      case "Refinement": {
        return createConstraintFromRefinement(ast).pipe(
          Effect.flatMap((constraint2) => go(ast.from, { ...constraint, ...constraint2 })),
          Effect.flatMap((a) => {
            const error = ast.filter(a, AST.defaultParseOption, ast)

            if (Option.isNone(error)) {
              return Effect.succeed(a)
            }

            return Effect.fail(
              RandomExampleErrorImpl.make(
                `Cannot create an example for refinement ${
                  JSON.stringify(
                    error,
                    (_, value) => typeof value === "bigint" ? value.toString() : value
                  )
                }`
              )
            )
          })
        )
      }
      case "Transformation":
        return go(ast.to, constraint)
      case "UniqueSymbol":
        return Effect.fail(RandomExampleErrorImpl.make(`UniqueSymbol`))
      case "UndefinedKeyword":
        return Effect.fail(RandomExampleErrorImpl.make(`UndefinedKeyword`))
      case "VoidKeyword":
        return Effect.fail(RandomExampleErrorImpl.make(`VoidKeyword`))
      case "NeverKeyword": {
        return Effect.fail(RandomExampleErrorImpl.make(`NeverKeyword`))
      }
      case "BigIntKeyword": {
        return Effect.map(nextInteger, (number) => {
          if (constraint) {
            return resolveConstrainedBigint(BigInt(number), constraint)
          }
          return BigInt(number)
        })
      }
      case "SymbolKeyword":
        return Effect.fail(RandomExampleErrorImpl.make(`SymbolKeyword`))
      case "Suspend":
        return go(ast.f(), constraint)
      case "TemplateLiteral": {
        const result = pipe(
          ast.spans,
          Effect.reduce(ast.head, (acc, v) => Effect.map(go(v.type, constraint), (x) => `${acc}${x}${v.literal}`))
        )

        return result
      }
      case "Declaration": {
        const description = getDescription(ast)
        const identifier = pipe(
          AST.getAnnotation<AST.IdentifierAnnotation>(AST.IdentifierAnnotationId)(
            ast
          ),
          Option.getOrUndefined
        )

        if (description?.startsWith("Option<")) {
          return pipe(
            randomChoice([
              () => Effect.succeed(Option.none()),
              () => Effect.map(go(ast.typeParameters[0], constraint), (v) => Option.some(v))
            ]),
            Effect.flatMap((fn) => fn())
          )
        }

        if (identifier === "DateFromSelf") {
          return Effect.succeed(new Date())
        }

        return Effect.fail(
          RandomExampleErrorImpl.make(
            `Can't give an example for declaration: ${JSON.stringify(ast)}`
          )
        )
      }
    }
  }

  return go(schema.ast, undefined).pipe(
    Effect.provideServiceEffect(IntegerCounter, Ref.make(1))
  )
}

/** @internal */
const createConstraintFromRefinement = Unify.unify((ast: AST.Refinement) => {
  const typeId = pipe(
    ast,
    AST.getAnnotation<AST.JSONSchemaAnnotation>(AST.SchemaIdAnnotationId),
    Option.getOrUndefined
  )

  if (typeId === undefined) {
    const astStr = JSON.stringify(ast)
    const message = `Couldn't create an example for ${astStr}. Specify an example.`
    return Effect.fail(RandomExampleErrorImpl.make(message))
  }

  let from = ast.from
  while (from._tag === "Refinement") {
    from = from.from
  }

  let constraint: TypeConstraint | undefined
  if (from._tag === "NumberKeyword" || from._tag === "BigIntKeyword") {
    constraint = createNumberConstraint(typeId, ast)
  } else if (from._tag === "TupleType") {
    constraint = createTupleConstraint(typeId, ast)
  } else if (from._tag === "Transformation" && from.transformation._tag === "FinalTransformation") {
    return Effect.succeed(TypeConstraint({}))
  }

  if (constraint === undefined) {
    const astStr = JSON.stringify(ast)
    const message = `Couldn't create a constraint for ${astStr} Specify an example.`
    return Effect.fail(RandomExampleErrorImpl.make(message))
  }

  return Effect.succeed(constraint)
})

/** @internal */
const resolveConstrainedBigint = (
  number: bigint,
  constraint: TypeConstraint<bigint>
) => {
  const min = constraint.min && constraint.min + BigInt(constraint.minExclusive ? 1 : 0)
  const max = constraint.max && constraint.max - BigInt(constraint.maxExclusive ? 1 : 0)

  let result: number | bigint = number

  if (min && number < min) {
    result = min
  }
  if (max && number > max) {
    result = max
  }

  return result
}

/** @internal */
const resolveConstrainedNumber = (
  number: number,
  constraint: TypeConstraint<number>
) => {
  const min = constraint.min && constraint.min + (constraint.minExclusive ? 1 : 0)
  const max = constraint.max && constraint.max - (constraint.maxExclusive ? 1 : 0)

  let result: number | bigint = number

  if (min && number < min) {
    result = min
  }
  if (max && number > max) {
    result = max
  }
  if (constraint.integer && !Number.isInteger(number)) {
    result = Math.ceil(result)
  }

  return result
}

/** @internal */
const createNumberConstraint = (
  typeId: unknown,
  ast: AST.AST
): TypeConstraint | undefined => {
  const jsonSchema: any = ast.annotations[AST.JSONSchemaAnnotationId]

  if (typeId === Schema.IntSchemaId) {
    return TypeConstraint({ integer: true })
  } else if (typeId === Schema.BetweenSchemaId) {
    const [min, max] = [jsonSchema.minimum, jsonSchema.maximum]
    return TypeConstraint({ min, max })
  } else if (typeId === Schema.GreaterThanSchemaId) {
    const min = jsonSchema.exclusiveMinimum
    return TypeConstraint({ min, minExclusive: true })
  } else if (typeId === Schema.GreaterThanBigIntSchemaId) {
    const { min }: any = ast.annotations[typeId]
    return TypeConstraint({ min, minExclusive: true })
  } else if (typeId === Schema.GreaterThanOrEqualToSchemaId) {
    const min = jsonSchema.minimum
    return TypeConstraint({ min })
  } else if (typeId === Schema.GreaterThanOrEqualToBigIntSchemaId) {
    const { min }: any = ast.annotations[typeId]
    return TypeConstraint({ min })
  } else if (typeId === Schema.LessThanSchemaId) {
    const max = jsonSchema.exclusiveMaximum
    return TypeConstraint({ max, maxExclusive: true })
  } else if (typeId === Schema.LessThanBigIntSchemaId) {
    const { max }: any = ast.annotations[typeId]
    return TypeConstraint({ max, maxExclusive: true })
  } else if (typeId === Schema.LessThanOrEqualToSchemaId) {
    const max = jsonSchema.maximum
    return TypeConstraint({ max })
  } else if (typeId === Schema.LessThanOrEqualToBigIntSchemaId) {
    const { max }: any = ast.annotations[typeId]
    return TypeConstraint({ max })
  }
}

/** @internal */
const createTupleConstraint = (
  typeId: unknown,
  ast: AST.AST
): TypeConstraint | undefined => {
  const jsonSchema: any = ast.annotations[AST.JSONSchemaAnnotationId]

  if (typeId === Schema.MinItemsSchemaId) {
    const min = jsonSchema.minItems
    return TypeConstraint({ min })
  } else if (typeId === Schema.MaxItemsSchemaId) {
    const max = jsonSchema.maxItems
    return TypeConstraint({ max })
  } else if (typeId === Schema.ItemsCountSchemaId) {
    const min = jsonSchema.minItems
    const max = jsonSchema.maxItems
    return TypeConstraint({ min, max })
  }
}

/** @internal */
type TypeConstraint<T = any> = {
  min?: T
  minExclusive?: boolean
  max?: T
  maxExclusive?: boolean
  integer?: boolean
}

/** @internal */
const TypeConstraint = <T>(values: TypeConstraint<T>): TypeConstraint<T> => ({
  ...values
})
