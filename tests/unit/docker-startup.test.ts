import { afterEach, describe, expect, it } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
const temporary: string[] = [];
afterEach(() => {
  for (const path of temporary.splice(0))
    rmSync(path, { recursive: true, force: true });
});
function run(mode: string | undefined, failure = "") {
  const root = mkdtempSync(join(tmpdir(), "news-startup-"));
  temporary.push(root);
  const bin = join(root, "bin");
  mkdirSync(bin);
  const log = join(root, "commands");
  writeFileSync(
    join(bin, "npm"),
    '#!/bin/sh\necho "npm $*" >> "$COMMAND_LOG"\nif [ "$*" = "$FAIL_COMMAND" ]; then exit 9; fi\n',
    { mode: 0o755 },
  );
  writeFileSync(
    join(bin, "node"),
    '#!/bin/sh\necho "node $*" >> "$COMMAND_LOG"\n',
    { mode: 0o755 },
  );
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: bin + ":" + process.env.PATH,
    COMMAND_LOG: log,
    FAIL_COMMAND: failure,
  };
  if (mode === undefined) delete env.DEMO_MODE;
  else env.DEMO_MODE = mode;
  const result = spawnSync("sh", [resolve("scripts/start-docker.sh")], {
    env,
    encoding: "utf8",
  });
  return {
    status: result.status,
    commands: readFileSync(log, "utf8").trim().split("\n"),
  };
}
describe("Docker CMS startup", () => {
  it("starts the demo without contacting a database", () => {
    expect(run("true")).toEqual({ status: 0, commands: ["node server.js"] });
  });
  it.each(["false", undefined])(
    "prepares the CMS database before starting the server (%s)",
    (mode) => {
      expect(run(mode)).toEqual({
        status: 0,
        commands: ["npm run db:migrate", "npm run db:seed", "node server.js"],
      });
    },
  );
  it("does not seed or start the server when migrations fail", () => {
    expect(run("false", "run db:migrate")).toEqual({
      status: 9,
      commands: ["npm run db:migrate"],
    });
  });
  it("does not start the server when admin seeding fails", () => {
    expect(run("false", "run db:seed")).toEqual({
      status: 9,
      commands: ["npm run db:migrate", "npm run db:seed"],
    });
  });
});
