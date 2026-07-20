import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MemoryStore } from "../src/memory-store.mjs";
import { MemoryAgent } from "../src/agent.mjs";
import { QwenClient } from "../src/qwen-client.mjs";

async function setup() {
  const path = join(await mkdtemp(join(tmpdir(), "flowgrid-test-")), "memory.json");
  const store = await new MemoryStore(path).init();
  return { store, agent: new MemoryAgent({ store, qwen: new QwenClient({ mock: true }) }) };
}

test("a candidate is not retrieved until a human authorizes it", async () => {
  const { store, agent } = await setup();
  const { candidates } = await agent.ingest("p", { text: "We prefer local-first storage." });
  const before = await agent.ask("p", "What storage is authorized?");
  assert.equal(before.retrieved.length, 0);
  await store.approveMemory("p", candidates[0].id);
  const after = await agent.ask("p", "What storage is authorized?");
  assert.equal(after.retrieved.length, 1);
  assert.match(after.answer, /local-first/i);
});

test("memory persists across a new store instance", async () => {
  const { store, agent } = await setup();
  const { candidates } = await agent.ingest("p", { text: "We prefer local-first storage." });
  await store.approveMemory("p", candidates[0].id);
  const reloaded = await new MemoryStore(store.filePath).init();
  assert.equal(reloaded.listMemories("p")[0].status, "confirmed");
});

test("a confirmed revision preserves the superseded memory for audit", async () => {
  const { store, agent } = await setup();
  const first = await agent.ingest("p", { text: "We prefer local-first storage." });
  await store.approveMemory("p", first.candidates[0].id);
  const revision = await agent.ingest("p", { text: "Change to cloud-first storage instead." });
  const approved = await store.approveMemory("p", revision.candidates[0].id, first.candidates[0].id);
  const [previous] = store.listMemories("p", { includeClosed: true });
  assert.equal(approved.revisionOf, previous.id);
  assert.equal(previous.status, "superseded");
});

test("authorization is a one-way pending transition and revisions name their replacement", async () => {
  const { store, agent } = await setup();
  const first = await agent.ingest("p", { text: "We prefer local-first storage." });
  await store.approveMemory("p", first.candidates[0].id);
  await assert.rejects(() => store.approveMemory("p", first.candidates[0].id), /only pending/);

  const revision = await agent.ingest("p", { text: "Change to cloud-first storage instead." });
  await assert.rejects(() => store.approveMemory("p", revision.candidates[0].id), /requires replacesMemoryId/);
  await assert.rejects(
    () => store.approveMemory("p", revision.candidates[0].id, revision.candidates[0].id),
    /cannot replace itself/
  );
});

test("retrieval excludes zero-score and over-budget confirmed memories", async () => {
  const { store } = await setup();
  const chinese = await store.addMemory("p", {
    text: "项目坚持本地优先存储，避免上传客户资料。",
    status: "pending"
  });
  await store.approveMemory("p", chinese.id);
  assert.equal(store.relevantMemories("p", "天气怎么样？").length, 0);
  assert.equal(store.relevantMemories("p", "本地优先怎么处理？").length, 1);
  assert.equal(store.relevantMemories("p", "本地优先", 10).length, 0);
});

test("invalid model citations are rejected instead of being returned to the user", async () => {
  const { store } = await setup();
  const memory = await store.addMemory("p", { text: "Use local-first storage.", status: "pending" });
  await store.approveMemory("p", memory.id);
  const agent = new MemoryAgent({
    store,
    qwen: {
      mode: "test",
      json: async () => ({
        answer: "Bad citation",
        usedMemoryIds: ["M-not-retrieved"],
        needsHumanReview: false,
        reason: "bad"
      })
    }
  });
  const result = await agent.ask("p", "What storage is authorized?");
  assert.equal(result.usedMemoryIds.length, 0);
  assert.equal(result.needsHumanReview, true);
  assert.match(result.reason, /Invalid model output/);
});
