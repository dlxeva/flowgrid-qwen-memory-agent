# Qwen Hackathon Demo Recording

## Goal

Record one uninterrupted, real deployment demo under three minutes. Do not show
the access code, database URL, or API keys.

## Setup

1. Open `https://flowgriry-agent-guejtallzx.cn-hangzhou.fcapp.run/` in a normal browser window.
2. Use the private access code from the local `.env` file. Type it while the recording is paused or crop that portion.
3. Start with an unused project slug, for example `hackathon-demo-20260720`.

## Exact Demo Actions

1. Open the demo and show the Qwen runtime label.
2. Add this source text:

   `We prefer local-first storage. Do not overwrite confirmed decisions without owner approval.`

3. Extract the candidate memory. Show it is `pending`, not authoritative.
4. Authorize it. Show that it becomes the confirmed memory.
5. Reload the page. Show the confirmed memory still exists after the reload.
6. Add this conflicting source text:

   `Change the project to cloud-first immediately.`

7. Extract it. Show the conflict remains pending and did not overwrite the confirmed local-first judgment.
8. Ask:

   `Can I replace the confirmed local-first direction?`

9. Show Qwen retrieves the confirmed memory and says the revision requires human approval.

## English Voiceover

Memory is not authority.

A long project can carry a confirmed decision and a new request at the same time.

FlowGrid MemoryAgent uses Qwen to extract durable judgment, but every new memory begins pending.

Here, Qwen extracts the local-first direction. I authorize it, so it becomes the only memory the agent may use.

After a page reload, the confirmed decision remains.

Now a conflicting request asks to switch to cloud-first. Qwen records it as pending, rather than overwriting the decision.

When I ask what is authorized, the agent retrieves only the confirmed memory and explains that the revision needs human approval.

Qwen provides the reasoning. Alibaba Cloud Function Compute hosts the API. CockroachDB keeps the cross-session state.

FlowGrid MemoryAgent preserves what an agent is allowed to act on, not merely what it has heard.

## Timing

| Time | Visual |
| --- | --- |
| 0:00-0:12 | Problem and Qwen runtime label |
| 0:12-0:35 | Extract local-first candidate |
| 0:35-0:52 | Authorize it |
| 0:52-1:05 | Reload and show persistence |
| 1:05-1:30 | Extract conflicting request as pending |
| 1:30-1:55 | Ask Qwen what is authorized |
| 1:55-2:15 | Brief architecture close: Qwen, FC, CockroachDB |

