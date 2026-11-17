export const isDemo =
  process.env.DEMO_MODE === "true" ||
  (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production");
export const siteUrl =
  process.env.SITE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  "http://localhost:3000";
export const pageSize = 9;
// Disable when deploying without a continuously running publishing worker.
export const schedulingEnabled = process.env.SCHEDULING_ENABLED !== "false";
