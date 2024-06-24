import type * as CliConfig from "../CliConfig.js"

export const TypeId: CliConfig.TypeId = Symbol.for(
  "effect-http/CliConfig/TypeId"
) as CliConfig.TypeId

export const isCliConfig = (u: unknown): u is CliConfig.CliConfig =>
    typeof u === "object" && u !== null && TypeId in u
