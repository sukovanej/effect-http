import { ClientError } from "effect-http"
import { expect, test } from "vitest"

test("isClientSideError", () => {
  expect(ClientError.isClientSideError(ClientError.makeClientSide("error"))).toBe(true)
  expect(ClientError.isClientSideError(ClientError.makeServerSide("error", 400))).toBe(false)
})

test("isServerSideError", () => {
  expect(ClientError.isServerSideError(ClientError.makeServerSide("error", 400))).toBe(true)
  expect(ClientError.isServerSideError(ClientError.makeClientSide("error"))).toBe(false)
})
