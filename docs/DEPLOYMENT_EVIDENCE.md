# Deployed Verification Evidence

Date: 2026-07-20

## Runtime

- **Alibaba Cloud Function Compute:** `flowgrid-qwen-memory-agent`, Hangzhou region, custom Debian 12 / Node.js 22 runtime.
- **Qwen Cloud:** `qwen3.7-plus` through the DashScope OpenAI-compatible endpoint.
- **Durable state:** CockroachDB, selected by `DATABASE_URL`; the deployment uses `DATABASE_HOSTADDR` only as a DNS fallback while retaining the original hostname for TLS validation.
- **Public demo:** the Function Compute HTTP trigger is anonymous, but every `/api/*` operation requires the private `DEMO_ACCESS_CODE` header and request bodies are limited to 16 KB.

## Live Checks

1. `GET /health` returned `ok: true`, `mode: qwen-cloud`, and `model: qwen3.7-plus`.
2. An API request without the access code returned HTTP `401`.
3. The same request with the access code returned HTTP `200`.
4. A live Qwen turn created a `pending` candidate; after approval it became `confirmed`; a later Qwen question retrieved that confirmed memory.
5. A new CockroachDB-backed store instance read state written by a previous instance.

## Source Links For Evaluators

- [Qwen extraction and answer policy](../src/agent.mjs)
- [Qwen Cloud client](../src/qwen-client.mjs)
- [Durable CockroachDB memory store](../src/postgres-memory-store.mjs)
- [Cloud/local store selection](../src/store-factory.mjs)
- [HTTP access-code gate](../src/server.mjs)
- [Function Compute definition](../infra/s.yaml)
