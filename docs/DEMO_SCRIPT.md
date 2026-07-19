# Three-Minute Demo Script

1. **Problem, 0:00-0:20** — A chat can recall words, but it cannot tell whether a memory is authorized to change a project.
2. **Session one, 0:20-1:00** — Add: “We prefer local-first storage. Do not overwrite confirmed decisions without owner approval.” Show Qwen extracting a pending memory, then approve it.
3. **Session two, 1:00-1:35** — Submit: “Change the project to cloud-first immediately.” Show that Qwen stores a pending revision rather than replacing the confirmed memory.
4. **Session three, 1:35-2:15** — Ask: “What direction is authorized?” Show constrained retrieval loading only the approved local-first memory and Qwen explaining that the conflicting request needs review.
5. **Architecture, 2:15-2:40** — Show the Qwen extraction/answer loop, durable memory store, human authorization gate, and Alibaba Cloud deployment.
6. **Close, 2:40-3:00** — FlowGrid MemoryAgent converts long chat history into a small, traceable set of memories that an agent may actually act on.
