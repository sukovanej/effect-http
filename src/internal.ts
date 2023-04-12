import * as S from "@effect/schema/Schema";

import { ComputeEndpoint, InputSchemas } from "./api-types";

export const fillDefaultSchemas = <I extends InputSchemas>({
  response,
  query,
  params,
  body,
}: I): ComputeEndpoint<string, I>["schemas"] => ({
  response,
  query: query ?? (S.unknown as ComputeEndpoint<string, I>["schemas"]["query"]),
  params:
    params ?? (S.unknown as ComputeEndpoint<string, I>["schemas"]["params"]),
  body: body ?? (S.unknown as ComputeEndpoint<string, I>["schemas"]["body"]),
});
