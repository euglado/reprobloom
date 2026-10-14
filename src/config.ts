export interface Config {
  token: string;
  applicationId: string;
  guildId: string;
}

export function readConfig(env: NodeJS.ProcessEnv): Config {
  const token = env.DISCORD_TOKEN?.trim() ?? "";
  const applicationId = env.DISCORD_APPLICATION_ID?.trim() ?? "";
  const guildId = env.DISCORD_GUILD_ID?.trim() ?? "";
  if (!/^[A-Za-z0-9_.-]{30,200}$/.test(token) || token.includes("replace_with")) {
    throw new Error(
      "Run npm run setup / npm run setup komutunu çalıştırın. Invalid bot configuration.",
    );
  }
  if (![applicationId, guildId].every((id) => /^[0-9]{17,20}$/.test(id))) {
    throw new Error("Application/server ID must have 17–20 digits / Kimlikler 17–20 rakam olmalı.");
  }
  return { token, applicationId, guildId };
}
