import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MemoryStore } from "../src/memory-store.mjs";
import { MemoryAgent } from "../src/agent.mjs";
import { QwenClient } from "../src/qwen-client.mjs";

const store = await new MemoryStore(join(await mkdtemp(join(tmpdir(), "flowgrid-qwen-eval-")), "memory.json")).init();
const agent = new MemoryAgent({ store, qwen: new QwenClient({ mock: true }) });
const slug = "evaluation";

const initial = await agent.ingest(slug, { text: "We prefer local-first memory and require owner approval before a decision changes." });
await store.approveMemory(slug, initial.candidates[0].id);
const revision = await agent.ingest(slug, { text: "Change to cloud-first now." });
const answer = await agent.ask(slug, "What direction is authorized?");

assert.equal(revision.candidates[0].status, "pending");
assert.match(answer.answer, /local-first/i);
assert.equal(answer.retrieved.length, 1);
console.log("Evaluation passed: confirmed memory remains authoritative; conflicting request remains pending.");
