import { existsSync, writeFileSync } from "node:fs";
import { emitKeypressEvents } from "node:readline";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

process.chdir(fileURLToPath(new URL("..", import.meta.url)));
if (process.versions.node.split(".")[0] !== "24" || !process.stdin.isTTY || !process.stdout.isTTY) {
  console.error(
    "Open an interactive terminal with Node.js 24 / Node.js 24 ile etkileşimli terminal açın.",
  );
  process.exit(1);
}
if (existsSync(".env")) {
  console.error(
    ".env already exists; refusing overwrite / .env var; üzerine yazılmadı. Keep it private.",
  );
  process.exit(1);
}
console.log("ReproBloom setup / kurulum. Never share your bot token / Bot tokenını paylaşmayın.");
const rl = createInterface({ input: process.stdin, output: process.stdout });
const application = (await rl.question("Application ID / Uygulama kimliği: ")).trim();
const guild = (await rl.question("Server ID / Sunucu kimliği: ")).trim();
rl.close();
if (![application, guild].every((id) => /^[0-9]{17,20}$/.test(id))) {
  console.error("IDs must contain 17–20 digits / Kimlikler 17–20 rakam olmalı.");
  process.exit(1);
}
function hiddenToken() {
  return new Promise((resolve, reject) => {
    let text = "";
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdout.write("Bot token (hidden / gizli): ");
    function finish(error) {
      process.stdin.off("keypress", onKey);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(text);
    }
    function onKey(value, key) {
      if (key?.ctrl && key.name === "c") {
        finish(new Error("Cancelled / İptal"));
        return;
      }
      if (key?.name === "return" || key?.name === "enter") {
        finish();
        return;
      }
      if (key?.name === "backspace") {
        text = text.slice(0, -1);
        return;
      }
      if (
        typeof value === "string" &&
        /^[A-Za-z0-9_.-]+$/.test(value) &&
        text.length + value.length <= 200
      )
        text += value;
    }
    process.stdin.on("keypress", onKey);
  });
}
try {
  const token = await hiddenToken();
  if (!/^[A-Za-z0-9_.-]{30,200}$/.test(token) || token.includes("replace_with"))
    throw new Error("Invalid token format / Token biçimi geçersiz");
  writeFileSync(
    ".env",
    `DISCORD_TOKEN=${token}\nDISCORD_APPLICATION_ID=${application}\nDISCORD_GUILD_ID=${guild}\n`,
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "Saved private .env / Özel .env kaydedildi. Windows: restrict folder access to your account.",
  );
  console.log(
    `Install / Davet: https://discord.com/oauth2/authorize?client_id=${application}&scope=bot%20applications.commands&permissions=3072&integration_type=0`,
  );
  console.log("Next / Sonra: npm run register, then / ardından npm start.");
} catch {
  console.error(
    "Setup stopped without overwriting configuration / Kurulum durdu; mevcut yapılandırma değiştirilmedi.",
  );
  process.exitCode = 1;
}
