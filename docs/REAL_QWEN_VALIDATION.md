# Real Qwen Cloud Validation

Date: 2026-07-19

The project made a live request to Qwen Cloud using the OpenAI-compatible Chat Completions endpoint and `qwen3.7-plus`. The API key is stored only in the ignored local `.env` file and is not included here.

## Lifecycle exercised

1. A user turn stated: local-first storage is the current direction and cloud-sync proposals require owner authorization.
2. Qwen extracted durable candidate memories from the turn.
3. One local-first candidate was explicitly approved and became confirmed memory.
4. A later cloud-first request remained `pending`.
5. A third Qwen call retrieved only the one confirmed memory under the agent's context budget and answered that local-first remains authorized; it cannot be removed by the current request.

## Boundary

This verifies the real Qwen model integration and the agent's status-gated retrieval behavior. It does not verify Alibaba Cloud deployment or production-grade cloud persistence.
