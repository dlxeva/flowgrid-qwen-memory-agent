# Alibaba Cloud deployment

The hackathon requires a functioning Alibaba Cloud backend. The intended target is Alibaba Cloud Function Compute (FC) using the `infra/s.yaml` manifest.

Before deployment:

1. Create a Function Compute service and configure Serverless Devs credentials.
2. Put `DASHSCOPE_API_KEY` into the function's encrypted environment variables; never put it in this repository or the manifest.
3. Replace the local JSON file with an Alibaba Cloud persistence service before the public judging deployment. The local file is only for development because Function Compute instances are ephemeral.
4. Deploy, then record the live URL and deployment proof in `README.md`.

This directory is deployment scaffolding, not evidence of a completed Alibaba Cloud deployment.
