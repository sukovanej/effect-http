import { Effect } from "effect";
import * as Http from "effect-http";

import { Api, api } from "./api.js";
import { createItem, getItems } from "./repository.js";

const handleGetItems = ({ query }: Http.Input<Api, "getItems">) =>
  getItems(query).pipe(
    Effect.tap((items) => Effect.log(`Found ${items.length} items`)),
  );

const handleCreateItem = ({
  ResponseUtil,
  body,
}: Http.Input<Api, "createItem">) =>
  createItem(body).pipe(
    Effect.map((content) => ResponseUtil.response201({ content })),
  );

export const server = Http.server(api).pipe(
  Http.handle("getItems", handleGetItems),
  Http.handle("createItem", handleCreateItem),
);
