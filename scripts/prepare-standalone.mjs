import { access, cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, ".next/standalone");
await access(resolve(output, "server.js"));
await mkdir(resolve(output, ".next"), { recursive: true });

// Next.js standalone output does not include its static assets by default.
const assets = resolve(output, ".next/static");
await rm(assets, { recursive: true, force: true });
await cp(resolve(root, ".next/static"), assets, { recursive: true });

const publicDirectory = resolve(root, "public");
let hasPublicDirectory = false;
try {
  await access(publicDirectory);
  hasPublicDirectory = true;
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
if (hasPublicDirectory) {
  const publicOutput = resolve(output, "public");
  await rm(publicOutput, { recursive: true, force: true });
  await cp(publicDirectory, publicOutput, { recursive: true });
}
console.info("Standalone deployment prepared with static assets.");
