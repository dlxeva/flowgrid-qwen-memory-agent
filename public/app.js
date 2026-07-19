const slug = "demo-project";
const request = (path, options) => fetch(path, { headers: { "Content-Type": "application/json" }, ...options }).then(async (response) => {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Request failed");
  return payload;
});

async function refresh() {
  const { memories } = await request(`/api/projects/${slug}/memory`);
  document.querySelector("#memories").innerHTML = memories.length ? memories.map((memory) => `
    <article class="memory ${memory.status}">
      <small>${memory.id} / ${memory.kind} / ${memory.status}</small>
      <p>${memory.text}</p>
      <small>${memory.reviewReason}</small>
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
  document.querySelector("#turn-output").textContent = JSON.stringify(result, null, 2);
  refresh();
});

document.querySelector("#ask-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const result = await request(`/api/projects/${slug}/ask`, { method: "POST", body: JSON.stringify({ question: document.querySelector("#question").value }) });
  document.querySelector("#answer").textContent = JSON.stringify(result, null, 2);
});

request("/health").then((health) => { document.querySelector("#mode").textContent = `Runtime: ${health.mode} / ${health.model}`; });
refresh();
