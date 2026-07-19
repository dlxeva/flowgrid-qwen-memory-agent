import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

const emptyStore = () => ({ schemaVersion: 1, projects: {} });

export class MemoryStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = emptyStore();
    this.writeQueue = Promise.resolve();
  }

  async init() {
    await mkdir(dirname(this.filePath), { recursive: true });
    try {
      this.data = JSON.parse(await readFile(this.filePath, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await this.persist();
    }
    return this;
  }

  project(slug) {
    if (!this.data.projects[slug]) {
      this.data.projects[slug] = {
        slug,
        createdAt: new Date().toISOString(),
        sessions: [],
        memories: []
      };
    }
    return this.data.projects[slug];
  }

  async addSession(slug, { actor = "user", text, occurredAt = new Date().toISOString() }) {
    const project = this.project(slug);
    const session = { id: `S-${randomUUID().slice(0, 8)}`, actor, text, occurredAt };
    project.sessions.push(session);
    await this.persist();
    return session;
  }

  async addMemory(slug, memory) {
    const project = this.project(slug);
    const item = {
      id: `M-${randomUUID().slice(0, 8)}`,
      kind: memory.kind ?? "judgment",
      text: memory.text,
      status: memory.status ?? "pending",
      confidence: memory.confidence ?? "medium",
      sourceSessionIds: memory.sourceSessionIds ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revisionOf: memory.revisionOf ?? null,
      expiresWhen: memory.expiresWhen ?? null,
      reviewReason: memory.reviewReason ?? "Qwen extracted a possible durable memory."
    };
    project.memories.push(item);
    await this.persist();
    return item;
  }

  async approveMemory(slug, memoryId, replacesMemoryId = null) {
    const item = this.project(slug).memories.find((memory) => memory.id === memoryId);
    if (!item) return null;
    if (replacesMemoryId) {
      const previous = this.project(slug).memories.find((memory) => memory.id === replacesMemoryId);
      if (!previous || previous.status !== "confirmed") {
        throw new Error("replacesMemoryId must reference an existing confirmed memory");
      }
      previous.status = "superseded";
      previous.supersededBy = item.id;
      previous.updatedAt = new Date().toISOString();
      item.revisionOf = previous.id;
    }
    item.status = "confirmed";
    item.confirmedAt = new Date().toISOString();
    item.updatedAt = item.confirmedAt;
    await this.persist();
    return item;
  }

  async supersedeMemory(slug, memoryId, replacementId) {
    const item = this.project(slug).memories.find((memory) => memory.id === memoryId);
    if (!item) return null;
    item.status = "superseded";
    item.supersededBy = replacementId;
    item.updatedAt = new Date().toISOString();
    await this.persist();
    return item;
  }

  listMemories(slug, { includeClosed = false } = {}) {
    const memories = this.project(slug).memories;
    return includeClosed ? memories : memories.filter((memory) => memory.status !== "superseded");
  }

  relevantMemories(slug, question, maxChars = 1800) {
    const terms = new Set(question.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
    const candidates = this.listMemories(slug)
      .filter((memory) => memory.status === "confirmed")
      .map((memory) => ({
        memory,
        score: [...terms].reduce((score, term) => score + Number(memory.text.toLowerCase().includes(term)), 0)
      }))
      .sort((a, b) => b.score - a.score || b.memory.updatedAt.localeCompare(a.memory.updatedAt));

    const selected = [];
    let used = 0;
    for (const { memory } of candidates) {
      const size = memory.text.length + 140;
      if (selected.length && used + size > maxChars) continue;
      selected.push(memory);
      used += size;
    }
    return selected;
  }

  async persist() {
    const nextWrite = this.writeQueue.then(async () => {
      const temporary = `${this.filePath}.tmp`;
      await writeFile(temporary, `${JSON.stringify(this.data, null, 2)}\n`, "utf8");
      await rename(temporary, this.filePath);
    });
    this.writeQueue = nextWrite.catch(() => {});
    return nextWrite;
  }
}
