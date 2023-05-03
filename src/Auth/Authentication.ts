export const authorized = () => ({ result: "AccessGranted" } as const);
export const unauthorized = (message: string) =>
  ({ result: "Unauthorized", message } as const);

export type AuthenticationResult =
  | ReturnType<typeof authorized>
  | ReturnType<typeof unauthorized>;
