import * as internal from "../internal/api";
import type { AnyApi, Api, ApiGroup, Endpoint } from "./Api";

export type AuthenticationType = "none" | "basic-auth";

type SetEndpointAuth<E, Auth extends AuthenticationType> = E extends Endpoint<
  infer Id,
  any,
  infer R,
  infer Q,
  infer P,
  infer B,
  infer H
>
  ? Endpoint<Id, Auth, R, Q, P, B, H>
  : never;

type SetAllEndpointsAuth<Es, Auth extends AuthenticationType> = Es extends [
  infer E1,
  ...infer ERest,
]
  ? [SetEndpointAuth<E1, Auth>, ...SetAllEndpointsAuth<ERest, Auth>]
  : [];

export type SetApiAuth<
  A extends AnyApi,
  Auth extends AuthenticationType,
> = A extends Api<infer Es> ? Api<SetAllEndpointsAuth<Es, Auth>> : never;

export type SetApiGroupAuth<
  A extends ApiGroup,
  Auth extends AuthenticationType,
> = A extends ApiGroup<infer Es>
  ? ApiGroup<SetAllEndpointsAuth<Es, Auth>>
  : never;

export const basicAuth: {
  <A extends AnyApi>(api: A): SetApiAuth<A, "basic-auth">;
  // <A extends ApiGroup>(apiGroup: A): SetApiGroupAuth<A, "basic-auth">;
} = internal.basicAuth;
