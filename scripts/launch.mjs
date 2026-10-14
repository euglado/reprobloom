import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

process.chdir(fileURLToPath(new URL("..", import.meta.url)));
if (process.versions.node.split(".")[0] !== "24") {
  console.error("Install Node.js 24 LTS / Node.js 24 LTS kurun.");
  process.exit(1);
}
const target = process.argv[2];
if (target !== "main" && target !== "register") process.exit(1);
if (existsSync(".env")) {
  try {
    process.loadEnvFile(".env");
  } catch {
    console.error(
      "Could not read .env / .env okunamadı. Run setup after moving old configuration safely.",
    );
    process.exit(1);
  }
}
const token = process.env.DISCORD_TOKEN?.trim() ?? "";
if (
  !/^[A-Za-z0-9_.-]{30,200}$/.test(token) ||
  token.includes("replace_with") ||
  ![process.env.DISCORD_APPLICATION_ID, process.env.DISCORD_GUILD_ID].every((v) =>
    /^[0-9]{17,20}$/.test(v ?? ""),
  )
) {
  console.error(
    "Missing or invalid configuration / Yapılandırma eksik veya geçersiz. Run npm run setup.",
  );
  process.exit(1);
}
const compiler = spawnSync(
  process.execPath,
  ["node_modules/typescript/bin/tsc", "-p", "tsconfig.json"],
  { stdio: "inherit" },
);
if (compiler.error || compiler.status !== 0) {
  console.error("Build failed. Run npm ci --ignore-scripts / Derleme başarısız.");
  process.exit(1);
}
const result = spawnSync(process.execPath, [`dist/src/${target}.js`], { stdio: "inherit" });
process.exitCode = result.status ?? 1;
