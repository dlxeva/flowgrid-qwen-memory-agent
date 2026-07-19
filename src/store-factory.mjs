import { MemoryStore } from "./memory-store.mjs";
import { PostgresMemoryStore } from "./postgres-memory-store.mjs";

export async function createMemoryStore({ filePath, databaseUrl = process.env.DATABASE_URL } = {}) {
  const store = databaseUrl
    ? new PostgresMemoryStore(databaseUrl)
    : new MemoryStore(filePath);
  return store.init();
}
