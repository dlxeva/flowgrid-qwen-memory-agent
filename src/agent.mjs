const extractionSystem = `You are FlowGrid MemoryAgent. Extract only durable human preferences, confirmed decisions, and candidate revisions from a single user turn. Never invent a decision. A request to change a confirmed decision must remain pending until a human approves it. Return JSON only: {"memories":[{"kind":"preference|judgment|revision","text":"short statement","status":"pending","confidence":"low|medium|high","expiresWhen":"optional condition","reviewReason":"why a human must approve"}]}.`;

const answerSystem = `You are FlowGrid MemoryAgent. Answer from the supplied confirmed memories only. In this system, confirmed means currently authorized; pending means not authorized. Treat pending memories as non-authoritative. If a confirmed memory says a direction or constraint applies until owner approval, explicitly say that it remains authorized and cannot be removed by the current request. State uncertainty only for facts the confirmed set does not cover. Return JSON only: {"answer":"...","usedMemoryIds":["M-..."],"needsHumanReview":true|false,"reason":"..."}.`;

function mockExtraction(text) {
  const normalized = text.trim();
  const lower = normalized.toLowerCase();
  const kind = lower.includes("prefer") ? "preference" : lower.includes("change") || lower.includes("instead") ? "revision" : "judgment";
  return {
    memories: [{
      kind,
      text: normalized,
      status: "pending",
      confidence: lower.includes("always") || lower.includes("must") ? "high" : "medium",
      expiresWhen: kind === "revision" ? "when the project owner explicitly approves or rejects it" : null,
      reviewReason: "Mock mode preserves the same human authorization gate as Qwen mode."
    }]
  };
}

function mockAnswer(question, memories) {
  if (!memories.length) {
    return { answer: "I do not have an authorized memory that answers this yet.", usedMemoryIds: [], needsHumanReview: true, reason: "No confirmed memory matched the question." };
  }
  return {
    answer: `Authorized memory says: ${memories.map((memory) => memory.text).join(" ")}`,
    usedMemoryIds: memories.map((memory) => memory.id),
    needsHumanReview: false,
    reason: "Answer is limited to confirmed memories."
  };
}

export class MemoryAgent {
  constructor({ store, qwen }) {
    this.store = store;
    this.qwen = qwen;
  }

  async ingest(slug, { text, actor = "user" }) {
    const session = await this.store.addSession(slug, { text, actor });
    if (actor !== "user") return { session, candidates: [], mode: this.qwen.mode };

    const extraction = await this.qwen.json({
      system: extractionSystem,
      prompt: `User turn:\n${text}`,
      fallback: () => mockExtraction(text)
    });

    const candidates = [];
    for (const proposed of extraction.memories ?? []) {
      if (!proposed.text?.trim()) continue;
      candidates.push(await this.store.addMemory(slug, {
        ...proposed,
        status: "pending",
        sourceSessionIds: [session.id]
      }));
    }
    return { session, candidates, mode: this.qwen.mode };
  }

  async ask(slug, question) {
    const memories = this.store.relevantMemories(slug, question);
    const compact = memories.map((memory) => ({ id: memory.id, text: memory.text, kind: memory.kind, confirmedAt: memory.confirmedAt }));
    const result = await this.qwen.json({
      system: answerSystem,
      prompt: `Question: ${question}\n\nConfirmed memory (limited context):\n${JSON.stringify(compact)}`,
      fallback: () => mockAnswer(question, memories)
    });
    return { ...result, memoryBudgetChars: 1800, retrieved: compact, mode: this.qwen.mode };
  }
}
