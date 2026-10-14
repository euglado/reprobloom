import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanField,
  escapeText,
  fields,
  language,
  limits,
  makeReport,
  type Report,
  renderReport,
  words,
} from "../src/domain.js";
import { command, modal } from "../src/ui.js";

const report: Report = {
  summary: "Menu freezes, v1.2",
  steps: "1. Open menu\n2. Select settings",
  expected: "Settings open",
  actual: "Menu freezes",
};
test("report normalizes Windows line endings and outer whitespace", () => {
  assert.equal(
    makeReport({ ...report, steps: "  1. Open\r\n2. Click\r3. Wait  " }).steps,
    "1. Open\n2. Click\n3. Wait",
  );
});
for (const field of fields) {
  test(`${field} accepts its exact limit and rejects overflow`, () => {
    assert.equal(cleanField("a".repeat(limits[field]), field).length, limits[field]);
    assert.throws(() => cleanField("a".repeat(limits[field] + 1), field));
  });
}
for (const [name, text] of [
  ["empty", "   "],
  ["tab", "a\tb"],
  ["NUL", "a\0b"],
  ["bidi override", "a\u202eb"],
  ["zero width", "a\u200bb"],
  ["unpaired surrogate", "a\ud800"],
  ["line separator", "a\u2028b"],
  ["link", "https://example.com"],
  ["web prefix", "WWW.example.com"],
  ["invite", "discord.gg/example"],
  ["user mention", "<@123456789012345678>"],
  ["role mention", "<@&123456789012345678>"],
  ["channel mention", "<#123456789012345678>"],
  ["everyone", "@everyone"],
  ["here", "@here"],
  ["credential label", "password: dummy-value"],
  ["Turkish credential", "parola=example"],
] as const)
  test(`rejects ${name}`, () => assert.throws(() => cleanField(text, "steps")));
test("recognizable token syntax is rejected without echoing it", () => {
  const synthetic = `${"x".repeat(24)}.${"y".repeat(6)}.${"z".repeat(28)}`;
  assert.throws(() => cleanField(synthetic, "steps"), { message: "Invalid report field" });
});
test("Turkish and supplementary Unicode text remains readable", () => {
  assert.equal(cleanField("Açılır menü donuyor 😀", "summary"), "Açılır menü donuyor 😀");
});
test("escaped user formatting cannot introduce headings or spoilers", () => {
  assert.equal(
    escapeText("**test** ||secret|| [link](target) > quote"),
    "\\*\\*test\\*\\* \\|\\|secret\\|\\| \\[link\\]\\(target\\) \\> quote",
  );
});
test("report does not mutate input and includes four headings", () => {
  const before = JSON.stringify(report);
  assert.match(renderReport(makeReport(report), "en"), /Steps to reproduce/);
  assert.match(renderReport(report, "tr"), /Gerçekleşen sonuç/);
  assert.equal(JSON.stringify(report), before);
});
test("worst-case escaped preview fits Discord's 2000-unit content limit in both languages", () => {
  const worst = makeReport(
    Object.fromEntries(fields.map((f) => [f, "*".repeat(limits[f])])) as Report,
  );
  for (const lang of ["tr", "en"] as const) {
    assert.ok(renderReport(worst, lang).length + words[lang].warning.length + 2 < 2000);
  }
});
test("locale fallback is English with explicit Turkish support", () => {
  assert.equal(language("tr-TR"), "tr");
  assert.equal(language("en-US"), "en");
  assert.equal(language("de"), "en");
  assert.equal(language(null), "en");
});
test("command is guild-install only with optional language choices", () => {
  const json = command().toJSON();
  assert.deepEqual(json.contexts, [0]);
  assert.deepEqual(json.integration_types, [0]);
  assert.equal(json.options?.length, 1);
  assert.equal(json.name, "reprobloom");
});
test("current Label modal has four bounded required text inputs", () => {
  const json = modal("a".repeat(36), "tr").toJSON();
  assert.equal(json.components.length, 4);
  for (const [index, part] of json.components.entries()) {
    assert.equal(part.type, 18);
    assert.ok("component" in part);
    const component = part.component;
    assert.ok("custom_id" in component && "max_length" in component && "required" in component);
    const field = fields[index];
    assert.ok(field);
    assert.equal(component.custom_id, field);
    assert.equal(component.max_length, limits[field]);
    assert.equal(component.required, true);
  }
});
