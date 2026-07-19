const DEFAULT_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

function parseJson(content) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? content;
  return JSON.parse(fenced.trim());
}

export class QwenClient {
  constructor({
    apiKey = process.env.DASHSCOPE_API_KEY,
    baseUrl = process.env.QWEN_BASE_URL ?? DEFAULT_BASE_URL,
    model = process.env.QWEN_MODEL ?? "qwen3.7-plus",
    mock = process.env.DEMO_MODE === "mock"
  } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.model = model;
    this.mock = mock;
  }

  get mode() {
    return this.mock ? "mock" : "qwen-cloud";
  }

  async json({ system, prompt, fallback }) {
    if (this.mock) return fallback();
    if (!this.apiKey) {
      throw new Error("DASHSCOPE_API_KEY is required for a real Qwen Cloud run. Set DEMO_MODE=mock only for local development.");
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        // This agent needs bounded structured extraction, not an unbounded reasoning trace.
        enable_thinking: false,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ]
      }),
      signal: AbortSignal.timeout(30_000)
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(`Qwen Cloud error ${response.status}: ${payload?.message ?? JSON.stringify(payload)}`);
    return parseJson(payload.choices?.[0]?.message?.content ?? "{}");
  }
}
