export const isDemo =
  process.env.DEMO_MODE === "true" ||
  (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production");
export const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
export const pageSize = 9;
