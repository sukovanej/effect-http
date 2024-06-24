import { Data } from "effect";
import { Api } from "effect-http";

export class CliConfig extends Data.TaggedClass("CliConfig")<{
    api: Api.Api.Any,
    server?: Partial<{
        port: number
    }>
}> {}
