import { Effect } from "effect"
import { Api, Handler } from "effect-http"

const endpoint = Api.get("getArticle", "/article")

// $ExpectType Handler<Default<"getArticle">, never, never>
Handler.make(endpoint, () => Effect.void)

// $ExpectType Handler<Default<"getArticle">, never, never>
endpoint.pipe(Handler.make(() => Effect.void))
