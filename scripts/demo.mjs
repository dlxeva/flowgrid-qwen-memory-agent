import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MemoryStore } from "../src/memory-store.mjs";
import { MemoryAgent } from "../src/agent.mjs";
import { QwenClient } from "../src/qwen-client.mjs";

const store = await new MemoryStore(join(await mkdtemp(join(tmpdir(), "flowgrid-qwen-")), "memory.json")).init();
const agent = new MemoryAgent({ store, qwen: new QwenClient({ mock: true }) });
const slug = "product-launch";

const first = await agent.ingest(slug, { text: "We prefer local-first storage. Do not overwrite confirmed decisions without owner approval." });
await store.approveMemory(slug, first.candidates[0].id);
const second = await agent.ingest(slug, { text: "Change the project to cloud-first immediately." });
const answer = await agent.ask(slug, "Can I replace the local-first direction now?");

console.log(JSON.stringify({
  mode: agent.qwen.mode,
  confirmed: store.listMemories(slug).filter((memory) => memory.status === "confirmed"),
  pendingRevision: second.candidates[0],
  answer
}, null, 2));
