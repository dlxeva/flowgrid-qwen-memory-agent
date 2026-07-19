import { Pool } from "pg";
import { MemoryStore } from "./memory-store.mjs";

const initialState = () => ({ schemaVersion: 1, projects: {} });

/**
 * Small durable adapter for the hackathon service. The state model remains
 * identical to the local JSON store so authorization semantics cannot drift
 * between local and deployed runs.
 */
export class PostgresMemoryStore extends MemoryStore {
  constructor(connectionString) {
    super("postgres://flowgrid-memory-state");
    this.pool = new Pool({
      connectionString,
      // CockroachDB Cloud uses TLS; its connection URL selects the target host.
      ssl: { rejectUnauthorized: false }
    });
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS flowgrid_memory_state (
        state_key STRING PRIMARY KEY,
        state JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    const result = await this.pool.query(
      "SELECT state FROM flowgrid_memory_state WHERE state_key = $1",
      ["primary"]
    );
    this.data = result.rows[0]?.state ?? initialState();
    if (!result.rows[0]) await this.persist();
    return this;
  }

  async persist() {
    const nextWrite = this.writeQueue.then(() => this.pool.query(
      `INSERT INTO flowgrid_memory_state (state_key, state, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (state_key)
       DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
      ["primary", JSON.stringify(this.data)]
    ));
    this.writeQueue = nextWrite.catch(() => {});
    return nextWrite;
  }
}
