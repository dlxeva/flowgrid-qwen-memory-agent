# Devpost Submission Draft

## Title

FlowGrid MemoryAgent: Memory Is Not Authority

## Tagline

A Qwen-powered memory agent that remembers durable human judgment across sessions without allowing an unreviewed request to rewrite the project.

## Inspiration

Long AI projects do not usually fail because the model forgets every word. They fail because an agent cannot tell the difference between a current, authorized decision and a new request that merely sounds persuasive. A summary can sound certain while silently erasing the rationale, rejected alternatives, and review boundary that made the original decision safe.

We built a focused new MemoryAgent implementation for this hackathon to make that distinction executable. Memory should preserve what an agent is allowed to act on, not merely what it has seen.

## What It Does

FlowGrid MemoryAgent turns a user turn into a structured, source-linked memory candidate using Qwen Cloud. Every candidate starts as `pending`. Only an explicit human authorization promotes it to `confirmed`, and only confirmed memory is retrieved for later Qwen answers.

The live lifecycle is:

1. Qwen extracts a durable preference, judgment, or revision from a user turn.
2. The agent stores the source and a pending candidate in durable state.
3. A human approves, rejects, or supersedes the candidate.
4. A later session retrieves a small budgeted set of confirmed memories only.
5. A conflicting request remains visible as a pending revision instead of overwriting the existing direction.

This creates a practical authorization boundary for cross-session memory. The agent can be helpful without becoming the authority that changes the project.

## How We Built It

- **Qwen Cloud** (`qwen3.7-plus`) performs structured extraction and constrained answer synthesis through the DashScope OpenAI-compatible API.
- **Alibaba Cloud Function Compute** hosts the Node.js 22 HTTP service.
- **CockroachDB** stores project sessions, memory candidates, confirmed judgments, and supersession history across process instances.
- The HTTP service includes an access-code gate for all API routes and a 16 KB request cap for the public evaluator demo.
- The state model separates source session, pending candidate, human authorization, confirmed memory, and later retrieval rather than flattening them into a chat summary.

Architecture: `docs/architecture.svg`  
Alibaba deployment source: `infra/s.yaml`  
Live verification evidence: `docs/DEPLOYMENT_EVIDENCE.md`

## Challenges We Ran Into

The Function Compute region could not resolve the CockroachDB endpoint through its default DNS path, even though public egress was enabled. We kept the database hostname as the TLS authority and introduced a deployment-only `DATABASE_HOSTADDR` fallback for the current resolved endpoint IP. This retained certificate validation while avoiding a new NAT or VPC resource.

The other challenge was safety versus testability. The Function Compute HTTP trigger is anonymous so a judge can reach the demo, but every API request requires an application-level access code. The repository never contains the Qwen key, database URL, or evaluator code.

## Accomplishments

- Ran a real deployed Qwen lifecycle: `pending` candidate -> human approval -> `confirmed` durable memory -> later Qwen retrieval.
- Verified that an API call without the evaluator access code returns `401`, while an authorized evaluator can use the full demo.
- Verified that a new CockroachDB-backed store instance can read state written by another instance.
- Kept the project distinct from the existing local-first FlowGrid core: this is an independent, open-source hackathon runtime that tests the cloud memory-agent slice without changing the parent product's direction.

## What We Learned

Persistent memory is not a single storage problem. It is a state-governance problem. A system that remembers more context but fails to represent `pending`, `confirmed`, and `superseded` status can make a cross-session agent less trustworthy, not more.

## What's Next

- Add automatic expiry and recheck triggers for stale memories.
- Add provenance tracing from a retrieved judgment back to source turns and approvals.
- Compare status-gated retrieval with raw-history prompting on longer, messier project histories.
- Keep the cloud runtime as a focused validation branch while the local-first FlowGrid core continues its separate real-project evaluation.

## Built With

Qwen Cloud, Alibaba Cloud Function Compute, CockroachDB, Node.js, JavaScript, HTML, CSS.

## Testing Instructions (Private Devpost Field)

1. Open the URL supplied below.
2. Enter the private demo access code supplied in the Devpost testing field.
3. Submit: `We prefer local-first storage. Do not overwrite confirmed decisions without owner approval.`
4. Confirm the extracted candidate is marked `pending`, then choose **Authorize memory**.
5. Ask: `Can I replace the confirmed local-first direction?`
6. Confirm that the answer uses the authorized memory and that a new conflicting request remains pending until a human authorizes it.

Demo URL: `https://flowgriry-agent-guejtallzx.cn-hangzhou.fcapp.run`

Do not put the access code in the public repository or video.

## Video Capture Checklist

Keep the final video below three minutes:

1. 0:00-0:20: state the problem: chat memory is not authority.
2. 0:20-0:55: show the public demo URL, Qwen Cloud runtime label, and a new user turn becoming `pending`.
3. 0:55-1:20: authorize the candidate and show it become `confirmed`.
4. 1:20-1:50: submit a conflicting revision; show it stays pending.
5. 1:50-2:20: ask a later-session question and show confirmed-only retrieval.
6. 2:20-2:40: show the architecture diagram and deployment evidence in the repository.
7. 2:40-2:55: close with the access boundary: memory stores what the agent may act on, not only what it has heard.
