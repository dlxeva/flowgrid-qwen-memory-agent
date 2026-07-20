import { Pool } from "pg";
import { MemoryStore } from "./memory-store.mjs";

const initialState = () => ({ schemaVersion: 1, projects: {} });

/**
 * Small durable adapter for the hackathon service. The state model remains
 * identical to the local JSON store so authorization semantics cannot drift
 * between local and deployed runs.
 */
export class PostgresMemoryStore extends MemoryStore {
  constructor(connectionString, { hostaddr = process.env.DATABASE_HOSTADDR } = {}) {
    super("postgres://flowgrid-memory-state");
    const databaseHost = new URL(connectionString).hostname;
    this.pool = new Pool({
      connectionString,
      // A Function Compute region can lack DNS for a foreign Cockroach endpoint.
      // Connect to an explicitly supplied IP while retaining the hostname for TLS.
      ...(hostaddr ? { host: hostaddr } : {}),
      ssl: {
        rejectUnauthorized: true,
        servername: databaseHost,
        ...(process.env.DATABASE_CA_CERT ? { ca: process.env.DATABASE_CA_CERT } : {})
      }
    });
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS flowgrid_memory_state (
        state_key STRING PRIMARY KEY,
        state JSONB NOT NULL,
        version INT8 NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await this.pool.query("ALTER TABLE flowgrid_memory_state ADD COLUMN IF NOT EXISTS version INT8 NOT NULL DEFAULT 1");
    const result = await this.pool.query(
      "SELECT state, version FROM flowgrid_memory_state WHERE state_key = $1",
      ["primary"]
    );
    this.data = result.rows[0]?.state ?? initialState();
    this.version = Number(result.rows[0]?.version ?? 0);
    if (!result.rows[0]) await this.persist();
    return this;
  }

  async persist() {
    const nextWrite = this.writeQueue.then(async () => {
      if (!this.version) {
        const inserted = await this.pool.query(
          `INSERT INTO flowgrid_memory_state (state_key, state, version, updated_at)
           VALUES ($1, $2::jsonb, 1, now())
           ON CONFLICT (state_key) DO NOTHING
           RETURNING version`,
          ["primary", JSON.stringify(this.data)]
        );
        if (inserted.rows[0]) {
          this.version = Number(inserted.rows[0].version);
          return;
        }
        throw new Error("memory state was initialized concurrently; retry the request");
      }
      const updated = await this.pool.query(
        `UPDATE flowgrid_memory_state
         SET state = $2::jsonb, version = version + 1, updated_at = now()
         WHERE state_key = $1 AND version = $3
         RETURNING version`,
        ["primary", JSON.stringify(this.data), this.version]
      );
      if (!updated.rows[0]) throw new Error("memory state changed in another runtime; retry the request");
      this.version = Number(updated.rows[0].version);
    });
    this.writeQueue = nextWrite.catch(() => {});
    return nextWrite;
  }
}
