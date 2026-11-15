// Web-layer store. MongoDB holds console preferences and alert rules only —
// monitors, checks and incidents stay in the Rails app's SQLite database.
// When MongoDB is unreachable every read returns defaults and every write fails
// soft, so the console keeps working without it.

import { MongoClient, type Collection, type Document, type OptionalId } from "mongodb";

const URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const DB = process.env.MONGODB_DB ?? "beacondock_console";

declare global {
  // eslint-disable-next-line no-var
  var __bdMongo: Promise<MongoClient | null> | undefined;
}

async function connect(): Promise<MongoClient | null> {
  try {
    const client = new MongoClient(URI, { serverSelectionTimeoutMS: 1500 });
    await client.connect();
    return client;
  } catch {
    return null;
  }
}

// One shared connection promise for the process (Next dev re-imports modules).
export function mongoClient(): Promise<MongoClient | null> {
  globalThis.__bdMongo ??= connect().catch(() => null);
  return globalThis.__bdMongo;
}

export async function collection<T extends Document>(name: string): Promise<Collection<T> | null> {
  const client = await mongoClient();
  return client ? client.db(DB).collection<T>(name) : null;
}

export type Doc<T> = OptionalId<T> & { _id?: unknown };
