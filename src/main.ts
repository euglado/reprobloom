import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import { handler } from "./bot.js";
import { readConfig } from "./config.js";
import { DraftStore } from "./store.js";

const config = readConfig(process.env);
const store = new DraftStore();
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    MessageManager: 0,
    GuildMemberManager: 0,
    UserManager: 0,
  }),
  allowedMentions: { parse: [] },
  rest: { retries: 0, timeout: 10_000 },
});
const clean = setInterval(() => store.prune(), 30_000);
clean.unref();
client.once(Events.ClientReady, () => {
  if (client.user?.id !== config.applicationId) {
    console.error(
      "Bot token and application ID do not match / Token ve uygulama kimliği eşleşmiyor.",
    );
    stop();
    process.exitCode = 1;
    return;
  }
  console.log("ReproBloom ready / hazır. Use /reprobloom.");
});
client.on(Events.InteractionCreate, handler(config.guildId, config.applicationId, store));
client.on(Events.Error, () =>
  console.error("Discord connection error / bağlantı hatası. Check configuration/network."),
);
client.on(Events.Warn, () => console.error("Discord connection warning / bağlantı uyarısı."));
function stop() {
  clearInterval(clean);
  store.clear();
  client.destroy();
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
try {
  await client.login(config.token);
} catch {
  stop();
  console.error("Login failed / Giriş başarısız. Check token and network; never share token.");
  process.exitCode = 1;
}
