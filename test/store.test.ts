import assert from "node:assert/strict";
import test from "node:test";
import { DraftStore } from "../src/store.js";

const scope = { user: "u", guild: "g", channel: "c" };
const report = { summary: "a", steps: "b", expected: "c", actual: "d" };
test("random nonces are unique and forms are consumed only once", () => {
  const store = new DraftStore();
  const form = store.create(scope, "en");
  assert.ok(form);
  assert.match(form.id, /^[a-f0-9]{36}$/);
  assert.ok(store.take(form.id, scope, "form"));
  assert.equal(store.take(form.id, scope, "form"), undefined);
  assert.notEqual(store.create(scope, "en")?.id, form.id);
});
for (const field of ["user", "guild", "channel"] as const)
  test(`mismatched ${field} cannot consume a form`, () => {
    const store = new DraftStore();
    const d = store.create(scope, "en");
    assert.ok(d);
    assert.equal(store.take(d.id, { ...scope, [field]: "wrong" }, "form"), undefined);
    assert.ok(store.take(d.id, scope, "form"));
  });
test("preview requires a matching bound message and stage", () => {
  const store = new DraftStore();
  const d = store.create(scope, "tr", report);
  assert.ok(d);
  assert.equal(store.take(d.id, scope, "form"), undefined);
  assert.equal(store.take(d.id, scope, "preview", "m"), undefined);
  store.bind(d.id, "m");
  assert.equal(store.take(d.id, scope, "preview", "other"), undefined);
  assert.ok(store.take(d.id, scope, "preview", "m"));
  assert.equal(store.take(d.id, scope, "preview", "m"), undefined);
});
test("expiry is strict at five minutes and cleanup frees capacity", () => {
  let now = 0;
  const store = new DraftStore(() => now);
  const d = store.create(scope, "en");
  assert.ok(d);
  now = 300_000;
  assert.equal(store.take(d.id, scope, "form"), undefined);
  assert.ok(store.create(scope, "en"));
});
test("one active draft per member/server replaces an earlier channel draft", () => {
  const store = new DraftStore();
  const first = store.create(scope, "en");
  assert.ok(first);
  const second = store.create({ ...scope, channel: "other" }, "tr");
  assert.ok(second);
  assert.equal(store.take(first.id, scope, "form"), undefined);
});
test("capacity is bounded and existing owner can replace at capacity", () => {
  const store = new DraftStore();
  for (let n = 0; n < 100; n++) assert.ok(store.create({ ...scope, user: `${n}` }, "en"));
  assert.equal(store.create({ ...scope, user: "extra" }, "en"), undefined);
  assert.ok(store.create({ ...scope, user: "0" }, "tr"));
});
test("cooldowns separate keys and expire at their boundary", () => {
  let now = 10;
  const store = new DraftStore(() => now);
  assert.ok(store.allow("user:1", 5_000));
  assert.equal(store.allow("user:1", 5_000), false);
  assert.ok(store.allow("user:2", 5_000));
  now = 5_010;
  assert.ok(store.allow("user:1", 5_000));
});
test("rate map rejects new keys at capacity and clear removes all state", () => {
  const store = new DraftStore();
  for (let n = 0; n < 500; n++) assert.ok(store.allow(`${n}`, 5_000));
  assert.equal(store.allow("overflow", 5_000), false);
  const form = store.create(scope, "en");
  assert.ok(form);
  store.clear();
  assert.equal(store.take(form.id, scope, "form"), undefined);
  assert.ok(store.allow("overflow", 5_000));
});
