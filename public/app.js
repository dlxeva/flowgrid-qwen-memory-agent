const slug = "demo-project";
const apiBase = (new URLSearchParams(window.location.search).get("api") ?? window.location.origin).replace(/\/$/, "");
const accessCode = document.querySelector("#access-code");
accessCode.value = sessionStorage.getItem("flowgrid-demo-code") ?? "";
accessCode.addEventListener("input", () => sessionStorage.setItem("flowgrid-demo-code", accessCode.value.trim()));
accessCode.addEventListener("change", () => {
  refresh().catch((error) => { document.querySelector("#memories").textContent = error.message; });
});

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", "\"": "&quot;"
}[character]));

const request = (path, options = {}) => fetch(`${apiBase}${path}`, {
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...(accessCode.value.trim() ? { "X-FlowGrid-Demo-Code": accessCode.value.trim() } : {}),
    ...options.headers
  }
}).then(async (response) => {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Request failed");
  return payload;
});

async function refresh() {
  const { memories } = await request(`/api/projects/${slug}/memory`);
  document.querySelector("#memories").innerHTML = memories.length ? memories.map((memory) => `
    <article class="memory ${memory.status}">
      <small>${escapeHtml(memory.id)} / ${escapeHtml(memory.kind)} / ${escapeHtml(memory.status)}</small>
      <p>${escapeHtml(memory.text)}</p>
      <small>${escapeHtml(memory.reviewReason)}</small>
      ${memory.status === "pending" ? `<button data-id="${memory.id}">Authorize memory</button>` : ""}
    </article>`).join("") : "<p>No memories yet.</p>";
  document.querySelectorAll("[data-id]").forEach((button) => button.addEventListener("click", async () => {
    await request(`/api/projects/${slug}/memories/${button.dataset.id}/approve`, { method: "POST", body: JSON.stringify({}) });
    refresh();
  }));
}

document.querySelector("#turn-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const result = await request(`/api/projects/${slug}/turns`, { method: "POST", body: JSON.stringify({ text: document.querySelector("#turn").value }) });
  const candidates = result.candidates ?? [];
  document.querySelector("#turn-output").innerHTML = `
    <section class="receipt pending">
      <h3>Qwen extracted ${candidates.length} candidate ${candidates.length === 1 ? "memory" : "memories"}</h3>
      <p>They remain pending until an owner authorizes them.</p>
      <small>${candidates.map((candidate) => `${escapeHtml(candidate.id)}: ${escapeHtml(candidate.text)}`).join("<br>")}</small>
    </section>`;
  refresh();
});

document.querySelector("#ask-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const result = await request(`/api/projects/${slug}/ask`, { method: "POST", body: JSON.stringify({ question: document.querySelector("#question").value }) });
  const memoryIds = result.usedMemoryIds?.length ? result.usedMemoryIds.map(escapeHtml).join(", ") : "none";
  document.querySelector("#answer").innerHTML = `
    <section class="receipt">
      <h3>Authorized memory response</h3>
      <p>${escapeHtml(result.answer)}</p>
      <small>Retrieved: ${memoryIds}${result.needsHumanReview ? " · Human review needed" : ""}</small>
    </section>`;
});

request("/health").then((health) => { document.querySelector("#mode").textContent = `Runtime: ${health.mode} / ${health.model}`; });
refresh().catch((error) => { document.querySelector("#memories").textContent = error.message; });
