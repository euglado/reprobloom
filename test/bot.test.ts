import assert from "node:assert/strict";
import test from "node:test";
import {
  ChannelType,
  type GuildTextBasedChannel,
  type Interaction,
  MessageFlags,
} from "discord.js";
import { freshAccess, handler } from "../src/bot.js";
import { words } from "../src/domain.js";
import { DraftStore } from "../src/store.js";

const app = "111111111111111111";
const guild = "222222222222222222";
const scope = { user: "333333333333333333", guild, channel: "444444444444444444" };
const report = {
  summary: "Menu v1",
  steps: "Open menu",
  expected: "Menu opens",
  actual: "Menu freezes",
};
type Payload = {
  content?: string;
  flags?: number;
  components?: { toJSON(): { components: { custom_id?: string }[] } }[];
  allowedMentions?: { parse: string[] };
};
function interaction(kind: "command" | "form" | "button", customId = "") {
  const calls: {
    modal?: { toJSON(): { custom_id: string } };
    replies: Payload[];
    edits: Payload[];
    defers: string[];
  } = { replies: [], edits: [], defers: [] };
  const i = {
    applicationId: app,
    guildId: guild,
    channelId: scope.channel,
    user: { id: scope.user },
    locale: "en-US",
    channel: { type: ChannelType.GuildText },
    memberPermissions: { has: () => true },
    appPermissions: { has: () => true },
    commandName: "reprobloom",
    customId,
    deferred: false,
    replied: false,
    isChatInputCommand: () => kind === "command",
    isModalSubmit: () => kind === "form",
    isButton: () => kind === "button",
    inGuild: () => true,
    options: { getString: () => null as string | null },
    fields: { getTextInputValue: (f: keyof typeof report) => report[f] },
    message: {
      id: "preview",
      author: { id: app, bot: true },
      webhookId: app,
      flags: { has: () => true },
    },
    async showModal(m: NonNullable<typeof calls.modal>) {
      calls.modal = m;
    },
    async reply(p: Payload) {
      calls.replies.push(p);
      i.replied = true;
    },
    async editReply(p: Payload) {
      calls.edits.push(p);
      return { id: "preview" };
    },
    async deferReply() {
      i.deferred = true;
      calls.defers.push("reply");
    },
    async deferUpdate() {
      i.deferred = true;
      calls.defers.push("update");
    },
  };
  return { i, calls, typed: i as unknown as Interaction };
}
function rig() {
  let now = 0;
  const store = new DraftStore(() => now);
  const sent: Payload[] = [];
  const accessCalls: Interaction[] = [];
  const channel = {
    async send(p: Payload) {
      sent.push(p);
    },
  };
  const run = handler(guild, app, store, async (i) => {
    accessCalls.push(i);
    return channel as unknown as GuildTextBasedChannel;
  });
  function button(action = "share") {
    const d = store.create(scope, "en", report);
    assert.ok(d);
    store.bind(d.id, "preview");
    return interaction("button", `rb:${action}:${d.id}`);
  }
  return {
    store,
    sent,
    accessCalls,
    channel,
    run,
    button,
    advance: (n: number) => {
      now += n;
    },
  };
}
test("full command/form/preview/share path is explicit and public output has no controls or IDs", async () => {
  const r = rig();
  const command = interaction("command");
  await r.run(command.typed);
  const id = command.calls.modal?.toJSON().custom_id;
  assert.ok(id);
  assert.equal(r.sent.length, 0);
  const form = interaction("form", id);
  await r.run(form.typed);
  assert.deepEqual(form.calls.defers, ["reply"]);
  const preview = form.calls.edits[0];
  assert.ok(preview);
  assert.match(preview.content ?? "", /Only you see/);
  assert.equal(r.sent.length, 0);
  const shareId = preview.components?.[0]?.toJSON().components[0]?.custom_id;
  assert.ok(shareId);
  const click = interaction("button", shareId);
  await r.run(click.typed);
  assert.equal(r.sent.length, 1);
  assert.deepEqual(r.sent[0]?.allowedMentions, { parse: [] });
  assert.equal(r.sent[0]?.flags, MessageFlags.SuppressEmbeds);
  assert.equal(r.sent[0]?.components, undefined);
  assert.ok(!r.sent[0]?.content?.includes(scope.user));
  assert.match(click.calls.edits[0]?.content ?? "", /Shared/);
});
test("discard consumes draft without fresh access or sending", async () => {
  const r = rig();
  const click = r.button("discard");
  await r.run(click.typed);
  await r.run(click.typed);
  assert.equal(r.sent.length, 0);
  assert.equal(r.accessCalls.length, 0);
  assert.match(click.calls.edits[0]?.content ?? "", /Discarded/);
});
test("concurrent duplicate clicks perform at most one send", async () => {
  const r = rig();
  const click = r.button();
  await Promise.all([r.run(click.typed), r.run(click.typed)]);
  assert.equal(r.sent.length, 1);
  assert.equal(r.accessCalls.length, 1);
});
for (const mismatch of [
  "user",
  "guild",
  "channel",
  "application",
  "message",
  "author",
  "webhook",
  "ephemeral",
  "human",
] as const) {
  test(`share rejects mismatched ${mismatch}`, async () => {
    const r = rig();
    const c = r.button();
    if (mismatch === "user") c.i.user.id = "other";
    if (mismatch === "guild") c.i.guildId = "other";
    if (mismatch === "channel") c.i.channelId = "other";
    if (mismatch === "application") c.i.applicationId = "other";
    if (mismatch === "message") c.i.message.id = "other";
    if (mismatch === "author") c.i.message.author.id = "other";
    if (mismatch === "webhook") c.i.message.webhookId = "other";
    if (mismatch === "ephemeral") c.i.message.flags.has = () => false;
    if (mismatch === "human") c.i.message.author.bot = false;
    await r.run(c.typed);
    assert.equal(r.sent.length, 0);
    assert.equal(r.accessCalls.length, 0);
  });
}
test("thread channels and missing initial permissions fail closed", async () => {
  for (const reason of ["thread", "member", "bot"]) {
    const r = rig();
    const c = r.button();
    if (reason === "thread") Object.assign(c.i.channel, { type: ChannelType.PublicThread });
    if (reason === "member") c.i.memberPermissions.has = () => false;
    if (reason === "bot") c.i.appPermissions.has = () => false;
    await r.run(c.typed);
    assert.equal(r.sent.length, 0);
  }
});
test("permission loss at fresh fetch stops publication and consumes draft", async () => {
  const r = rig();
  const click = r.button();
  const run = handler(guild, app, r.store, async () => undefined);
  await run(click.typed);
  await r.run(click.typed);
  assert.equal(r.sent.length, 0);
});
test("failed send is never retried and raw error is not disclosed", async () => {
  const r = rig();
  const click = r.button();
  let attempts = 0;
  r.channel.send = async () => {
    attempts++;
    throw new Error("sensitive raw detail");
  };
  await r.run(click.typed);
  await r.run(click.typed);
  assert.equal(attempts, 1);
  assert.ok(!JSON.stringify(click.calls).includes("sensitive raw detail"));
});
test("invalid submitted fields are private and not retained for publication", async () => {
  const r = rig();
  const d = r.store.create(scope, "tr");
  assert.ok(d);
  const form = interaction("form", `rb:form:${d.id}`);
  form.i.fields.getTextInputValue = () => "https://example.com/private";
  await r.run(form.typed);
  assert.equal(form.calls.edits[0]?.content, words.tr.invalid);
  assert.ok(!JSON.stringify(form.calls).includes("example.com"));
  assert.equal(r.sent.length, 0);
});
test("forged or expired form cannot produce a preview", async () => {
  const r = rig();
  const form = interaction("form", `rb:form:${"a".repeat(36)}`);
  await r.run(form.typed);
  assert.equal(form.calls.edits.length, 0);
  const d = r.store.create(scope, "en");
  assert.ok(d);
  r.advance(300_000);
  await r.run(interaction("form", `rb:form:${d.id}`).typed);
  assert.equal(r.sent.length, 0);
});
test("form command cooldown works and explicit Turkish overrides locale", async () => {
  const r = rig();
  const a = interaction("command");
  a.i.options.getString = () => "tr";
  await r.run(a.typed);
  const b = interaction("command");
  await r.run(b.typed);
  assert.ok(a.calls.modal);
  assert.equal(b.calls.modal, undefined);
  r.advance(5_000);
  const c = interaction("command");
  await r.run(c.typed);
  assert.ok(c.calls.modal);
});
test("channel cooldown applies to a different member as well", async () => {
  const r = rig();
  await r.run(r.button().typed);
  const other = { ...scope, user: "555555555555555555" };
  const d = r.store.create(other, "en", report);
  assert.ok(d);
  r.store.bind(d.id, "preview");
  const click = interaction("button", `rb:share:${d.id}`);
  click.i.user.id = other.user;
  await r.run(click.typed);
  assert.equal(r.sent.length, 1);
  assert.equal(click.calls.edits[0]?.content, words.en.busy);
  r.advance(60_000);
  await r.run(r.button().typed);
  assert.equal(r.sent.length, 2);
});
test("unrelated commands/buttons are ignored", async () => {
  const r = rig();
  const c = interaction("command");
  c.i.commandName = "other";
  await r.run(c.typed);
  assert.equal(c.calls.replies.length, 0);
  const b = interaction("button", "other:button");
  await r.run(b.typed);
  assert.equal(b.calls.replies.length, 0);
});
test("malformed controls and stage confusion cannot send", async () => {
  const r = rig();
  for (const id of ["rb:share:bad", `rb:unknown:${"a".repeat(36)}`, `rb:form:${"a".repeat(36)}`])
    await r.run(interaction("button", id).typed);
  assert.equal(r.sent.length, 0);
});
test("fresh access fetches roles, channel and both uncached members; revoked access is rejected", async () => {
  for (const denied of ["none", "member", "bot", "channel"]) {
    const calls: string[] = [];
    const channel = {
      type: ChannelType.GuildText,
      permissionsFor: (m: { id: string }) => ({
        has: () => denied !== (m.id === scope.user ? "member" : "bot"),
      }),
    };
    const fake = {
      user: { id: scope.user },
      channelId: scope.channel,
      client: { user: { id: app } },
      guild: {
        roles: {
          async fetch() {
            calls.push("roles");
          },
        },
        channels: {
          async fetch(_id: string, options: { force: boolean }) {
            assert.equal(options.force, true);
            calls.push("channel");
            return denied === "channel" ? undefined : channel;
          },
        },
        members: {
          async fetch(options: { user: string; force: boolean; cache: boolean }) {
            assert.ok(options.force);
            assert.equal(options.cache, false);
            calls.push(options.user);
            return { id: options.user };
          },
        },
      },
    };
    const result = await freshAccess(fake as unknown as Interaction);
    assert.equal(Boolean(result), denied === "none");
    assert.deepEqual(calls.slice(0, 2), ["roles", "channel"]);
    if (denied !== "channel") assert.deepEqual(calls.slice(2), [scope.user, app]);
  }
});
