import { REST, Routes } from "discord.js";
import { readConfig } from "./config.js";
import { command } from "./ui.js";

const config = readConfig(process.env);
try {
  const rest = new REST({ version: "10", retries: 0, timeout: 10_000 }).setToken(config.token);
  // Upsert this command only. Never bulk-replace unrelated application commands.
  await rest.post(Routes.applicationGuildCommands(config.applicationId, config.guildId), {
    body: command().toJSON(),
  });
  console.log("/reprobloom registered in configured server / Seçilen sunucuda kaydedildi.");
} catch {
  console.error(
    "Command registration failed / Komut kaydı başarısız. Check IDs, token and installation.",
  );
  process.exitCode = 1;
}
