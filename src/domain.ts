export type Language = "tr" | "en";
export const fields = ["summary", "steps", "expected", "actual"] as const;
export type Field = (typeof fields)[number];
export type Report = Record<Field, string>;
export const limits: Record<Field, number> = {
  summary: 80,
  steps: 220,
  expected: 160,
  actual: 160,
};
export const words = {
  en: {
    title: "Community bug report",
    summary: "Problem and version",
    steps: "Steps to reproduce",
    expected: "Expected result",
    actual: "Actual result",
    form: "Prepare a short bug report",
    share: "Share in this channel",
    discard: "Discard",
    warning:
      "Only you see this preview. Review every section; remove names, passwords, tokens and private details. Sharing creates a public message in this channel. Expires in 5 minutes.",
    footer: "Community report; unverified. No files or private logs. Share redacted details only.",
    sent: "Shared in this channel. The public message remains until a moderator deletes it.",
    gone: "Discarded. The bot no longer keeps this draft. Discord may retain the private preview.",
    error:
      "Could not complete this action. The draft may have expired or permissions changed. Run /reprobloom again. If a send failed, check the channel before retrying; delivery can be uncertain.",
    busy: "Please wait before trying again, or try later if the bot is busy.",
    invalid:
      "Use all four fields within the displayed limits. Do not include links, mentions, hidden characters or recognizable credentials. Remove private details and try /reprobloom again.",
  },
  tr: {
    title: "Topluluk hata bildirimi",
    summary: "Sorun ve sürüm",
    steps: "Tekrarlama adımları",
    expected: "Beklenen sonuç",
    actual: "Gerçekleşen sonuç",
    form: "Kısa hata bildirimi hazırla",
    share: "Bu kanalda paylaş",
    discard: "Vazgeç",
    warning:
      "Bu önizlemeyi yalnızca siz görürsünüz. Her bölümü kontrol edin; isim, parola, token ve özel bilgileri çıkarın. Paylaşım bu kanalda herkese açık mesaj oluşturur. 5 dakika içinde sona erer.",
    footer:
      "Topluluk bildirimi; doğrulanmadı. Dosya veya özel günlük yok. Yalnızca temizlenmiş bilgileri paylaşın.",
    sent: "Bu kanalda paylaşıldı. Bir moderatör silene kadar herkese açık mesaj kalır.",
    gone: "Vazgeçildi. Bot taslağı artık tutmuyor. Discord özel önizlemeyi saklayabilir.",
    error:
      "İşlem tamamlanamadı. Taslağın süresi dolmuş veya izinler değişmiş olabilir. /reprobloom komutunu yeniden kullanın. Gönderim hatasında tekrar denemeden kanalı kontrol edin; teslim durumu belirsiz olabilir.",
    busy: "Tekrar denemeden biraz bekleyin; bot meşgulse daha sonra deneyin.",
    invalid:
      "Dört alanı da gösterilen sınırlarda doldurun. Bağlantı, etiket, görünmez karakter veya tanınabilir kimlik bilgisi eklemeyin. Özel bilgileri çıkarıp /reprobloom komutunu tekrar kullanın.",
  },
} as const;

export function language(value: string | null | undefined): Language {
  return value?.toLowerCase().startsWith("tr") ? "tr" : "en";
}

export function cleanField(value: string, field: Field): string {
  const text = value.replace(/\r\n?/g, "\n").trim();
  if (
    text.length < 1 ||
    text.length > limits[field] ||
    !text.isWellFormed() ||
    /[\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u.test(text) ||
    /[^\S\n ]/u.test(text) ||
    /[\p{Cc}]/u.test(text.replace(/\n/g, "")) ||
    /https?:|www\.|discord\.gg|<[@#]|@everyone|@here/i.test(text) ||
    /(?:mfa\.[\w-]{20,}|[\w-]{20,}\.[\w-]{6,}\.[\w-]{20,}|-----BEGIN|(?:token|password|api[_ -]?key|parola)\s*[:=]\s*\S{4,})/i.test(
      text,
    )
  )
    throw new Error("Invalid report field");
  return text;
}

export function makeReport(input: Report): Report {
  return Object.fromEntries(
    fields.map((field) => [field, cleanField(input[field], field)]),
  ) as Report;
}

export function escapeText(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!|>~]/g, "\\$&");
}

export function renderReport(report: Report, lang: Language): string {
  const w = words[lang];
  return `**${w.title}**\n\n${fields.map((f) => `**${w[f]}**\n${escapeText(report[f])}`).join("\n\n")}\n\n${w.footer}`;
}
