import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, sep } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readConfig } from "../src/config.js";

const valid = {
  DISCORD_TOKEN: "x".repeat(50),
  DISCORD_APPLICATION_ID: "1".repeat(18),
  DISCORD_GUILD_ID: "2".repeat(18),
};
test("valid environment is parsed with whitespace trimmed", () => {
  assert.equal(
    readConfig({ ...valid, DISCORD_GUILD_ID: ` ${valid.DISCORD_GUILD_ID} ` }).guildId,
    valid.DISCORD_GUILD_ID,
  );
});
for (const key of ["DISCORD_TOKEN", "DISCORD_APPLICATION_ID", "DISCORD_GUILD_ID"] as const) {
  test(`missing ${key} fails without disclosing environment values`, () => {
    assert.throws(
      () => readConfig({ ...valid, [key]: "" }),
      (e) => e instanceof Error && !e.message.includes(valid.DISCORD_TOKEN),
    );
  });
}
test("placeholder tokens and malformed IDs are rejected", () => {
  assert.throws(() => readConfig({ ...valid, DISCORD_TOKEN: "replace_with_your_bot_token" }));
  assert.throws(() => readConfig({ ...valid, DISCORD_GUILD_ID: "../../outside" }));
});
test("unconfigured compiled entrypoints and noninteractive setup fail safely without writes", () => {
  const root = realpathSync(tmpdir());
  const temp = mkdtempSync(resolve(root, "reprobloom-test-"));
  const checked = realpathSync(temp);
  assert.ok(checked.startsWith(`${root}${sep}`) && checked !== root);
  const env = { ...process.env };
  delete env.DISCORD_TOKEN;
  delete env.DISCORD_APPLICATION_ID;
  delete env.DISCORD_GUILD_ID;
  try {
    for (const name of ["main", "register"]) {
      const entry = fileURLToPath(new URL(`../src/${name}.js`, import.meta.url));
      const result = spawnSync(process.execPath, [entry], { cwd: temp, env, encoding: "utf8" });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /setup/);
      assert.equal(existsSync(resolve(temp, ".env")), false);
    }
    const setup = fileURLToPath(new URL("../../scripts/setup.mjs", import.meta.url));
    const result = spawnSync(process.execPath, [setup], { cwd: temp, env, encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /interactive/);
    assert.equal(existsSync(resolve(temp, ".env")), false);
  } finally {
    assert.equal(realpathSync(temp), checked, "Temporary path changed");
    assert.ok(checked.startsWith(`${root}${sep}`), "Unsafe temporary path");
    rmSync(checked, { recursive: true });
  }
});
