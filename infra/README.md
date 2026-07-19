# Alibaba Cloud deployment

The hackathon requires a functioning Alibaba Cloud backend. The intended target is Alibaba Cloud Function Compute (FC) using the `infra/s.yaml` manifest.

Before deployment:

1. Create a Function Compute service and configure Serverless Devs credentials.
2. Put `DASHSCOPE_API_KEY` into the function's encrypted environment variables; never put it in this repository or the manifest.
3. The current Function Compute demo writes to `/tmp` because deployed code is read-only. This supports a single warm-instance demo only; it is not durable across cold starts. Add an Alibaba Cloud persistence service before making a durable-memory claim in a public judging deployment.
4. Deploy, then record the live URL and deployment proof in `README.md`.

## Current demo deployment

The Function Compute demo was deployed and boot-checked on 2026-07-19 with the Node.js 22 custom runtime. Its HTTP trigger is intentionally configured for signature authentication, so it is not a public judge link yet. Turning it anonymous without an application-level quota guard would expose the Qwen-backed endpoint to abuse.
