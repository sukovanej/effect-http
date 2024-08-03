import * as path from "node:path"
import type { UserConfig } from "vitest/config"

const alias = (pkg: string) => ({
  [`${pkg}/test`]: path.join(__dirname, "packages", pkg, "test"),
  [pkg]: path.join(__dirname, "packages", pkg, "src")
})

// This is a workaround, see https://github.com/vitest-dev/vitest/issues/4744
const config: UserConfig = {
  test: {
    alias: {
      ...alias("effect-http"),
      ...alias("effect-http-node"),
      ...alias("effect-http-redoc")
    }
  }
}

export default config
