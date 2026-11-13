export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production" &&
    process.env.DEMO_MODE !== "true" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    const { validateLiveEnvironment } = await import("@/lib/env");
    validateLiveEnvironment();
  }
}
