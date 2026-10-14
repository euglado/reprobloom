import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const licenses = new Set([
  "MIT",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "Apache-2.0",
  "0BSD",
  "(MIT OR Apache-2.0)",
  "MIT OR Apache-2.0",
]);
let count = 0;
for (const [name, pkg] of Object.entries(lock.packages)) {
  if (!name) continue;
  if (
    !licenses.has(pkg.license) ||
    pkg.hasInstallScript ||
    !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(pkg.integrity ?? "") ||
    !pkg.resolved ||
    new URL(pkg.resolved).origin !== "https://registry.npmjs.org"
  ) {
    throw new Error(`Dependency policy failed: ${name}`);
  }
  count++;
}
const listed = (args) =>
  execFileSync("git", args, { encoding: "utf8" }).split("\0").filter(Boolean);
const tracked = listed(["ls-files", "-z"]);
if (tracked.some((f) => /(^|\/)\.env(?:\.|$)/.test(f) && !f.endsWith(".env.example")))
  throw new Error("Tracked private configuration");
const files = new Set([
  ...tracked,
  ...listed(["ls-files", "--others", "--exclude-standard", "-z"]),
]);
let scanned = 0;
for (const file of files) {
  if (/(^|\/)\.env(?:\.|$)/.test(file) || !/\.(?:ts|mjs|json|md|ya?ml|sh|cmd)$/.test(file))
    continue;
  const text = readFileSync(file, "utf8");
  if (
    /(?:mfa\.[A-Za-z0-9_-]{40,}|[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----)/.test(
      text,
    )
  ) {
    throw new Error(`Credential-pattern scan failed: ${file}`);
  }
  scanned++;
}
console.log(
  `Supply checks passed: ${count} dependency license/registry/SHA-512/no-install-script records; ${scanned} source credential-pattern scans. No private .env read.`,
);
