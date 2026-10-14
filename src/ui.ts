import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  LabelBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { fields, type Language, limits, words } from "./domain.js";

export function command() {
  return new SlashCommandBuilder()
    .setName("reprobloom")
    .setDescription("Privately prepare and preview a short community bug report")
    .setDescriptionLocalizations({
      tr: "Kısa topluluk hata bildirimi hazırla ve özel önizlemeyi kontrol et",
    })
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addStringOption((o) =>
      o
        .setName("language")
        .setDescription("Form and report language")
        .addChoices({ name: "Türkçe", value: "tr" }, { name: "English", value: "en" }),
    );
}

export function modal(id: string, lang: Language) {
  return new ModalBuilder()
    .setCustomId(`rb:form:${id}`)
    .setTitle(words[lang].form)
    .addLabelComponents(
      ...fields.map((field) =>
        new LabelBuilder()
          .setLabel(words[lang][field])
          .setDescription(`${limits[field]} characters / karakter`)
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId(field)
              .setStyle(field === "summary" ? TextInputStyle.Short : TextInputStyle.Paragraph)
              .setMinLength(1)
              .setMaxLength(limits[field])
              .setRequired(true),
          ),
      ),
    );
}

export function buttons(id: string, lang: Language) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`rb:share:${id}`)
      .setLabel(words[lang].share)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`rb:discard:${id}`)
      .setLabel(words[lang].discard)
      .setStyle(ButtonStyle.Secondary),
  );
}
