import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { MemoryStore } from "./memory-store.mjs";
import { QwenClient } from "./qwen-client.mjs";
import { MemoryAgent } from "./agent.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir = join(root, "public");
const store = await new MemoryStore(process.env.MEMORY_STORE_PATH ?? join(root, "data", "memory-store.json")).init();
const agent = new MemoryAgent({ store, qwen: new QwenClient() });

function send(response, status, body, contentType = "application/json; charset=utf-8") {
  response.writeHead(status, { "Content-Type": contentType, "Cache-Control": "no-store" });
  response.end(typeof body === "string" ? body : JSON.stringify(body, null, 2));
}

async function body(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function projectRoute(pathname) {
  return pathname.match(/^\/api\/projects\/([^/]+)\/(turns|memory|ask)$/);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (request.method === "GET" && url.pathname === "/health") return send(response, 200, { ok: true, mode: agent.qwen.mode, model: agent.qwen.model });
    if (request.method === "GET" && url.pathname === "/") return send(response, 200, await readFile(join(publicDir, "index.html"), "utf8"), "text/html; charset=utf-8");
    if (request.method === "GET" && url.pathname === "/app.js") return send(response, 200, await readFile(join(publicDir, "app.js"), "utf8"), "text/javascript; charset=utf-8");
    if (request.method === "GET" && url.pathname === "/styles.css") return send(response, 200, await readFile(join(publicDir, "styles.css"), "utf8"), "text/css; charset=utf-8");

    const approveMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/memories\/([^/]+)\/approve$/);
    if (request.method === "POST" && approveMatch) {
      const [, slug, memoryId] = approveMatch;
      const { replacesMemoryId = null } = await body(request);
      return send(response, 200, { memory: await store.approveMemory(slug, memoryId, replacesMemoryId) });
    }

    const match = projectRoute(url.pathname);
    if (match) {
      const [, slug, endpoint] = match;
      if (request.method === "POST" && endpoint === "turns") return send(response, 201, await agent.ingest(slug, await body(request)));
      if (request.method === "GET" && endpoint === "memory") return send(response, 200, { memories: store.listMemories(slug, { includeClosed: true }) });
      if (request.method === "POST" && endpoint === "ask") {
        const { question } = await body(request);
        return send(response, 200, await agent.ask(slug, question));
      }
    }
    return send(response, 404, { error: "Not found" });
  } catch (error) {
    return send(response, 500, { error: error.message });
  }
});

const port = Number(process.env.PORT ?? 8787);
server.listen(port, () => console.log(`FlowGrid MemoryAgent listening on http://localhost:${port} (${agent.qwen.mode})`));
