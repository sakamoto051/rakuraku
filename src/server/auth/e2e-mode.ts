// Test authentication must never be controlled by request headers or enabled in production.
export function isE2ETestMode(env: Record<string, string | undefined>): boolean {
  return (env.NODE_ENV === "test" || env.NODE_ENV === "development") && env.E2E_TEST_MODE === "true";
}
