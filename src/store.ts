import { randomBytes } from "node:crypto";
import type { Language, Report } from "./domain.js";

export interface Scope {
  user: string;
  guild: string;
  channel: string;
}
export interface Draft extends Scope {
  id: string;
  lang: Language;
  expires: number;
  report?: Report;
  message?: string;
}
const TTL = 5 * 60_000;
const MAX = 100;
const RATE_MAX = 500;

export class DraftStore {
  private drafts = new Map<string, Draft>();
  private rates = new Map<string, number>();
  constructor(private now: () => number = Date.now) {}

  prune(): void {
    const now = this.now();
    for (const [id, draft] of this.drafts) if (draft.expires <= now) this.drafts.delete(id);
    for (const [key, until] of this.rates) if (until <= now) this.rates.delete(key);
  }

  allow(key: string, delay: number): boolean {
    this.prune();
    if (this.rates.has(key) || this.rates.size >= RATE_MAX) return false;
    this.rates.set(key, this.now() + delay);
    return true;
  }

  create(scope: Scope, lang: Language, report?: Report): Draft | undefined {
    this.prune();
    for (const [id, d] of this.drafts)
      if (d.user === scope.user && d.guild === scope.guild) this.drafts.delete(id);
    if (this.drafts.size >= MAX) return undefined;
    const draft: Draft = {
      ...scope,
      id: randomBytes(18).toString("hex"),
      lang,
      expires: this.now() + TTL,
    };
    if (report) draft.report = { ...report };
    this.drafts.set(draft.id, draft);
    return draft;
  }

  bind(id: string, message: string): void {
    this.prune();
    const draft = this.drafts.get(id);
    if (draft?.report) draft.message = message;
  }

  take(id: string, scope: Scope, stage: "form" | "preview", message?: string): Draft | undefined {
    this.prune();
    const draft = this.drafts.get(id);
    if (
      !draft ||
      draft.user !== scope.user ||
      draft.guild !== scope.guild ||
      draft.channel !== scope.channel
    )
      return;
    if (
      stage === "form"
        ? !!draft.report
        : !draft.report || !draft.message || draft.message !== message
    )
      return;
    this.drafts.delete(id);
    return draft;
  }

  clear(): void {
    this.drafts.clear();
    this.rates.clear();
  }
}
