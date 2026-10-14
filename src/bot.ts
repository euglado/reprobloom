import {
  ChannelType,
  type GuildTextBasedChannel,
  type Interaction,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { fields, language, makeReport, type Report, renderReport, words } from "./domain.js";
import type { DraftStore, Scope } from "./store.js";
import { buttons, modal } from "./ui.js";

const required = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages];
export type AccessCheck = (i: Interaction) => Promise<GuildTextBasedChannel | undefined>;

export const freshAccess: AccessCheck = async (i) => {
  if (!i.guild || !i.channelId || !i.client.user) return;
  await i.guild.roles.fetch();
  const channel = await i.guild.channels.fetch(i.channelId, { force: true });
  if (
    !channel ||
    (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)
  )
    return;
  const member = await i.guild.members.fetch({ user: i.user.id, force: true, cache: false });
  const bot = await i.guild.members.fetch({ user: i.client.user.id, force: true, cache: false });
  if (!channel.permissionsFor(member)?.has(required) || !channel.permissionsFor(bot)?.has(required))
    return;
  return channel;
};

export function handler(
  guildId: string,
  applicationId: string,
  store: DraftStore,
  access: AccessCheck = freshAccess,
) {
  return async (i: Interaction): Promise<void> => {
    if (!i.isChatInputCommand() && !i.isModalSubmit() && !i.isButton()) return;
    if (i.isChatInputCommand() ? i.commandName !== "reprobloom" : !i.customId.startsWith("rb:"))
      return;
    let lang = language(i.locale);
    const fail = async (content: string) => {
      try {
        if (i.deferred || i.replied)
          await i.editReply({ content, components: [], allowedMentions: { parse: [] } });
        else
          await i.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
      } catch {
        /* An expired interaction cannot receive a safe response. */
      }
    };
    try {
      if (
        i.guildId !== guildId ||
        i.applicationId !== applicationId ||
        !i.channelId ||
        !i.inGuild() ||
        !i.channel ||
        (i.channel.type !== ChannelType.GuildText &&
          i.channel.type !== ChannelType.GuildAnnouncement) ||
        !i.memberPermissions?.has(required) ||
        !i.appPermissions?.has(required)
      ) {
        await fail(words[lang].error);
        return;
      }
      const scope: Scope = { user: i.user.id, guild: guildId, channel: i.channelId };
      if (i.isChatInputCommand()) {
        lang = language(i.options.getString("language") ?? i.locale);
        if (!store.allow(`form:${guildId}:${scope.user}`, 5_000)) {
          await fail(words[lang].busy);
          return;
        }
        const draft = store.create(scope, lang);
        if (!draft) {
          await fail(words[lang].busy);
          return;
        }
        await i.showModal(modal(draft.id, lang));
        return;
      }
      const match = /^rb:(form|share|discard):([a-f0-9]{36})$/.exec(i.customId);
      if (!match) {
        await fail(words[lang].error);
        return;
      }
      const [, action, id] = match;
      if (!id) return;
      if (i.isModalSubmit() && action === "form") {
        const form = store.take(id, scope, "form");
        if (!form) {
          await fail(words[lang].error);
          return;
        }
        lang = form.lang;
        await i.deferReply({ flags: MessageFlags.Ephemeral });
        let report: Report;
        try {
          report = makeReport(
            Object.fromEntries(fields.map((f) => [f, i.fields.getTextInputValue(f)])) as Report,
          );
        } catch {
          await fail(words[lang].invalid);
          return;
        }
        const draft = store.create(scope, lang, report);
        if (!draft) {
          await fail(words[lang].busy);
          return;
        }
        const message = await i.editReply({
          content: `${renderReport(report, lang)}\n\n${words[lang].warning}`,
          components: [buttons(draft.id, lang)],
          allowedMentions: { parse: [] },
          flags: MessageFlags.SuppressEmbeds,
        });
        store.bind(draft.id, message.id);
        return;
      }
      if (
        !i.isButton() ||
        (action !== "share" && action !== "discard") ||
        i.message.author.id !== applicationId ||
        i.message.webhookId !== applicationId ||
        !i.message.author.bot ||
        !i.message.flags.has(MessageFlags.Ephemeral)
      ) {
        await fail(words[lang].error);
        return;
      }
      const draft = store.take(id, scope, "preview", i.message.id);
      if (!draft?.report) {
        await fail(words[lang].error);
        return;
      }
      lang = draft.lang;
      await i.deferUpdate();
      if (action === "discard") {
        await fail(words[lang].gone);
        return;
      }
      if (!store.allow(`share:${guildId}:${scope.channel}`, 60_000)) {
        await fail(words[lang].busy);
        return;
      }
      const channel = await access(i);
      if (!channel) {
        await fail(words[lang].error);
        return;
      }
      await channel.send({
        content: renderReport(draft.report, lang),
        allowedMentions: { parse: [] },
        flags: MessageFlags.SuppressEmbeds,
      });
      await fail(words[lang].sent);
    } catch {
      await fail(words[lang].error);
    }
  };
}
