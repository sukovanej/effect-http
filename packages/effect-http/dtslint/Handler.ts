import { Effect } from "effect"
import { Api, Handler } from "effect-http"

const endpoint1 = Api.get("endpoint1", "/endpoint1")
const endpoint2 = Api.get("endpoint2", "/endpoint2")
const endpoint3 = Api.get("endpoint3", "/endpoint3")

declare const eff1: Effect.Effect<void, "E1", "R1">
declare const eff2: Effect.Effect<void, "E2", "R2">
declare const eff3: Effect.Effect<void, "E3", "R3">

// $ExpectType Handler<Default<"endpoint1">, never, never>
Handler.make(endpoint1, () => Effect.void)

// $ExpectType Handler<Default<"endpoint1">, never, never>
endpoint1.pipe(Handler.make(() => Effect.void))

// $ExpectType Handler<Default<"endpoint1"> | Default<"endpoint2">, never, never>
Handler.concat(
  Handler.make(endpoint1, () => Effect.void),
  Handler.make(endpoint2, () => Effect.void)
)

// $ExpectType Handler<Default<"endpoint1"> | Default<"endpoint2">, never, never>
Handler.make(endpoint1, () => Effect.void).pipe(Handler.concat(
  Handler.make(endpoint2, () => Effect.void)
))

// $ExpectType Handler<Default<"endpoint1"> | Default<"endpoint2">, "E1", "R1">
Handler.concat(
  Handler.make(endpoint1, () => eff1),
  Handler.make(endpoint2, () => Effect.void)
)

// $ExpectType Handler<Default<"endpoint1"> | Default<"endpoint2">, "E1" | "E2", "R1" | "R2">
Handler.concat(
  Handler.make(endpoint1, () => eff1),
  Handler.make(endpoint2, () => eff2)
)

// $ExpectType Handler<Default<"endpoint1"> | Default<"endpoint2"> | Default<"endpoint3">, "E1" | "E2" | "E3", "R1" | "R2" | "R3">
Handler.concatAll(
  Handler.make(endpoint1, () => eff1),
  Handler.make(endpoint2, () => eff2),
  Handler.make(endpoint3, () => eff3)
)
