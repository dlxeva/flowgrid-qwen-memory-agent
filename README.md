# FlowGrid MemoryAgent for Qwen Cloud

> Persistent memory should not give an AI authority it has not earned.

FlowGrid MemoryAgent is a Qwen-powered cross-session agent for durable human judgment. It turns a user turn into a **pending memory candidate**, requires human authorization before that candidate can affect future answers, and retrieves only confirmed memory within a fixed context budget.

## Why this is a new Qwen Cloud project

The existing FlowGrid project is a local-first ledger and host protocol. This repository is a separate hackathon implementation added during the Qwen Cloud hackathon period:

- Qwen Cloud performs structured memory extraction and answer synthesis.
- The agent maintains sources, candidate status, confirmation state, and supersession metadata across sessions.
- A conflicting request becomes a pending revision instead of silently overwriting confirmed judgment.
- The deployed API runs on Alibaba Cloud Function Compute, while CockroachDB stores the durable state.

This repository does **not** claim that the existing FlowGrid product has moved to the cloud.

## Architecture

```text
User turn
  -> Qwen Cloud structured extraction
  -> persistent source + pending memory candidate
  -> human authorization gate
  -> confirmed memory only
  -> constrained retrieval for a future Qwen answer
```

The browser demo exposes the lifecycle: add a user turn, authorize its candidate memory, then ask a later-session question. Pending revisions are visible but never used to answer. Its public API is protected by an application-level access code; the code belongs only in private evaluator instructions. The static browser client is hosted separately from the Function Compute API because FC's default public domain forces HTML responses to download.

![Architecture](docs/architecture.svg)

## Local run

Requires Node.js 20+.

```bash
cp .env.example .env
npm run dev
open http://localhost:8787
```

For a real Qwen run, export a Qwen Cloud pay-as-you-go API key:

```bash
export DASHSCOPE_API_KEY="sk-..."
unset DEMO_MODE
npm run dev
```

Qwen Cloud uses an OpenAI-compatible endpoint by default. A real Qwen lifecycle has been verified; see [validation evidence](docs/REAL_QWEN_VALIDATION.md). The local `DEMO_MODE=mock` fallback exists only to test the authorization lifecycle before credentials are available. It must not be used as proof of Qwen integration in a hackathon submission.

## Verification

```bash
npm test
npm run evaluate
npm run demo
```

The evaluation asserts that a confirmed local-first preference persists across sessions and a conflicting cloud-first request stays pending.

## Deployment status

The demo is deployed to Alibaba Cloud Function Compute. With `DATABASE_URL` unset, its `/tmp` store survives only while an instance stays warm. Configure a CockroachDB-compatible `DATABASE_URL` to persist the exact same judgment state across Function Compute cold starts. If the runtime cannot resolve the CockroachDB hostname, set `DATABASE_HOSTADDR` to a current endpoint IP; TLS still validates the hostname in `DATABASE_URL`. See [infra/README.md](infra/README.md) for the persistence boundary.

The public HTTP trigger is intentionally anonymous so evaluators can open the demo. Every `/api/*` route requires the `DEMO_ACCESS_CODE` header, request bodies are capped at 16 KB, and the HTTP runtime refuses to start without that code. Keep the access code in private evaluator instructions, never in this repository.

The browser never accepts an API endpoint through a URL query parameter. For a separately hosted static client, set its `html[data-api-base]` at deployment time to the approved Function Compute API origin.

## Evaluator testing

1. Open the browser demo URL supplied in the hackathon submission.
2. Enter the access code supplied in the private testing instructions.
3. Add a durable judgment, approve its pending candidate, then ask a later-session question.
4. Confirm that a pending candidate is never retrieved until approval.

The deployed verification record and source-file links are in [deployment evidence](docs/DEPLOYMENT_EVIDENCE.md).

## Submission readiness

See [the checklist](docs/SUBMISSION_CHECKLIST.md). Mock mode remains development-only; real Qwen and deployed lifecycle evidence are recorded separately.

## License

[MIT](LICENSE)
