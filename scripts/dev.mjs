import { spawn } from "node:child_process";
// Accept the host/port flags supplied by workspace preview runners as well as Next.js CLI flags.
const raw = process.argv.slice(2);
const args = [];
for (let i = 0; i < raw.length; i++) {
  if (raw[i] === "--strictPort") continue;
  args.push(raw[i] === "--host" ? "--hostname" : raw[i]);
}
if (!args.includes("--hostname")) args.push("--hostname", "0.0.0.0");
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", ...args],
  { stdio: "inherit", env: process.env },
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
