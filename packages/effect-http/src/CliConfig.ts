import { Data } from "effect";
import { Api } from "effect-http";
import * as internal from "./internal/cliConfig.js";

/**
 * @since 1.0.0
 * @category type id
 */
export const TypeId: unique symbol = internal.TypeId

/**
 * @since 1.0.0
 * @category type id
 */
export type TypeId = typeof TypeId

export class CliConfig extends Data.Class<{
    [TypeId]: typeof TypeId;
    api: Api.Api.Any;
    server?: Partial<{
        port: number
    }>;
    client?: Partial<{
        baseUrl: string
    }>
}> {}

export const make = (config: Omit<CliConfig, TypeId>) =>
    new CliConfig({ ...config, [TypeId]: TypeId });

export const isCliConfig = (u: unknown): u is CliConfig =>
    internal.isCliConfig(u);
