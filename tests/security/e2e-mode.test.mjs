import assert from "node:assert/strict";
import test from "node:test";
import { isE2ETestMode } from "../../src/server/auth/e2e-mode.ts";

for (const nodeEnv of ["production", "development", "test", undefined]) {
  for (const flag of ["true", "false", "", undefined]) {
    test(`E2E authentication: NODE_ENV=${nodeEnv}, flag=${flag}`, () => {
      assert.equal(
        isE2ETestMode({ NODE_ENV: nodeEnv, E2E_TEST_MODE: flag }),
        (nodeEnv === "test" || nodeEnv === "development") && flag === "true",
      );
    });
  }
}
test("request-like properties cannot enable E2E authentication", () => {
  assert.equal(isE2ETestMode({ NODE_ENV: "development", "x-e2e-test": "true" }), false);
});
