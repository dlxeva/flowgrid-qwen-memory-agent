# Qwen Cloud Hackathon Submission Checklist

## Already prepared

- [x] Independent project repository and MIT license
- [x] Cross-session memory lifecycle with source IDs, pending status, approval, supersession, and constrained retrieval
- [x] Local browser demo and mock-mode automated evaluation
- [x] Architecture diagram
- [x] Qwen OpenAI-compatible client, configured through `DASHSCOPE_API_KEY`

## Required before submission

- [x] Qwen Cloud API key and a recorded successful real invocation
- [x] Alibaba Cloud Function Compute deployment and public HTTP health check
- [x] Public demo access with an application-level access-code gate and 16 KB request cap
- [x] Durable deployed memory store: CockroachDB state survives new store instances; Alibaba Function Compute hosts the Qwen API
- [x] Public GitHub repository with setup and test instructions
- [ ] Three-minute-or-less public video showing real Qwen mode, cross-session recall, a pending conflicting revision, and human authorization
- [ ] Devpost English description, Qwen Track 1 selection, deployment-proof source-file link, architecture image, and testing URL
- [ ] Optional build-log/social post for the blog-post prize

## Non-claims

- Mock mode is not Qwen evidence.
- `/tmp` is only a no-database fallback. The deployed submission uses CockroachDB via `DATABASE_URL` and `DATABASE_HOSTADDR`.
- This agent demonstrates a focused judgment-memory workflow; it does not prove FlowGrid user adoption or replace the local-first core.
