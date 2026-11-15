// Console preferences and alert rules, stored in MongoDB (collection
// `console_prefs` / `alert_rules`). Reads fall back to defaults when the store
// is offline; writes report `stored: false` so the UI can say so.

import { ObjectId } from "mongodb";
import { collection } from "./mongo";

export interface Prefs {
  refreshSeconds: number; // 0 = off
  checksPerPage: 25 | 50 | 100;
}

export const DEFAULT_PREFS: Prefs = { refreshSeconds: 15, checksPerPage: 50 };

const PREFS_ID = "console";

export async function getPrefs(): Promise<{ prefs: Prefs; offline: boolean }> {
  const col = await collection<{ _id: string; value: Partial<Prefs> }>("console_prefs");
  if (!col) return { prefs: DEFAULT_PREFS, offline: true };
  const doc = await col.findOne({ _id: PREFS_ID }).catch(() => null);
  return { prefs: { ...DEFAULT_PREFS, ...(doc?.value ?? {}) }, offline: false };
}

export async function setPrefs(patch: Partial<Prefs>): Promise<{ prefs: Prefs; stored: boolean }> {
  const prefs = { ...DEFAULT_PREFS, ...sanitizePrefs(patch) };
  const col = await collection<{ _id: string; value: Prefs }>("console_prefs");
  if (!col) return { prefs, stored: false };
  await col
    .updateOne({ _id: PREFS_ID }, { $set: { value: prefs } }, { upsert: true })
    .catch(() => ({ prefs, stored: false }));
  return { prefs, stored: true };
}

function sanitizePrefs(patch: Partial<Prefs>): Partial<Prefs> {
  const out: Partial<Prefs> = {};
  if (patch.refreshSeconds !== undefined && [0, 5, 15, 30].includes(Number(patch.refreshSeconds))) {
    out.refreshSeconds = Number(patch.refreshSeconds);
  }
  if (patch.checksPerPage !== undefined && [25, 50, 100].includes(Number(patch.checksPerPage))) {
    out.checksPerPage = Number(patch.checksPerPage) as Prefs["checksPerPage"];
  }
  return out;
}

export type AlertEvent = "down" | "degraded" | "up";

export interface AlertRule {
  _id?: string;
  monitorId: number | null; // null = any monitor
  event: AlertEvent;
  createdAt: string;
}

export async function listAlertRules(): Promise<{ rules: AlertRule[]; offline: boolean }> {
  const col = await collection<AlertRule & { _id: ObjectId }>("alert_rules");
  if (!col) return { rules: [], offline: true };
  const docs = await col.find({}).sort({ createdAt: -1 }).limit(100).toArray().catch(() => []);
  return {
    rules: docs.map((d) => ({ _id: d._id.toHexString(), monitorId: d.monitorId, event: d.event, createdAt: d.createdAt })),
    offline: false,
  };
}

export async function addAlertRule(rule: { monitorId: number | null; event: AlertEvent }) {
  const col = await collection<AlertRule>("alert_rules");
  if (!col) return { stored: false };
  const doc: AlertRule = { monitorId: rule.monitorId, event: rule.event, createdAt: new Date().toISOString() };
  const res = await col.insertOne(doc).catch(() => null);
  return res ? { stored: true, rule: { ...doc, _id: res.insertedId.toString() } } : { stored: false };
}

export async function deleteAlertRule(id: string) {
  const col = await collection<AlertRule>("alert_rules");
  if (!col || !ObjectId.isValid(id)) return { stored: false };
  const res = await col.deleteOne({ _id: new ObjectId(id) } as never).catch(() => null);
  return { stored: !!res && res.deletedCount === 1 };
}

export async function mongoOk(): Promise<boolean> {
  return (await collection("console_prefs")) !== null;
}
