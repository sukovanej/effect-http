import { Effect } from "effect"
import { Api, Handler } from "effect-http"

const endpoint = Api.get("getArticle", "/article")

Handler.make(endpoint, () => Effect.void)

