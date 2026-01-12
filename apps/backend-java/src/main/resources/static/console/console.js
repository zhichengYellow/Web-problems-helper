(function () {
  const $ = (id) => document.getElementById(id);

  const state = {
    questions: [],
    editingId: null,
  };

  function escapeHtml(text) {
    return String(text ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatTime(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return String(iso);
    }
  }

  async function api(path, init) {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { success: false, error: text };
    }
    if (!res.ok) {
      const msg = json?.error || json?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return json;
  }

  async function refreshStatus() {
    $("status-text").textContent = "检测中...";
    try {
      const health = await api("/health");
      const info = await api("/api/console/info");
      $("status-text").textContent = "OK";
      $("status-json").textContent = JSON.stringify({ health, console: info }, null, 2);
    } catch (e) {
      $("status-text").textContent = `失败：${e.message}`;
      $("status-json").textContent = "";
    }
  }

  function showEditor(show) {
    const el = $("editor");
    if (show) el.classList.remove("hidden");
    else el.classList.add("hidden");
  }

  function clearEditor() {
    state.editingId = null;
    $("editor-title").textContent = "新增题目";
    $("editor-hint").textContent = "";
    $("f-type").value = "";
    $("f-source").value = "";
    $("f-question").value = "";
    $("f-options").value = "";
    $("f-answer").value = "";
    $("f-knowledge").value = "";
    $("f-tags").value = "";
  }

  function toCsvList(text) {
    return String(text ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function parseOptions(text) {
    const lines = String(text ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const items = [];
    for (const line of lines) {
      const idx = line.indexOf("|");
      if (idx > 0) {
        items.push({ label: line.slice(0, idx).trim(), text: line.slice(idx + 1).trim() });
      } else {
        items.push({ label: null, text: line });
      }
    }
    return items;
  }

  function stringifyOptions(options) {
    if (!Array.isArray(options) || options.length === 0) return "";
    return options
      .map((o) => {
        const label = (o?.label ?? "").trim();
        const text = (o?.text ?? "").trim();
        if (label) return `${label}|${text}`;
        return text;
      })
      .join("\n");
  }

  function editorPayload() {
    return {
      type: $("f-type").value.trim(),
      source: $("f-source").value.trim() || null,
      questionText: $("f-question").value.trim(),
      options: parseOptions($("f-options").value),
      answer: $("f-answer").value.trim() || null,
      knowledgePoints: toCsvList($("f-knowledge").value),
      tags: toCsvList($("f-tags").value),
    };
  }

  async function loadQuestions() {
    const query = $("q-query").value.trim();
    const url = query ? `/api/console/questions?query=${encodeURIComponent(query)}` : "/api/console/questions";
    const data = await api(url);
    state.questions = data.items || [];
    renderQuestions();
  }

  function renderPills(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return "";
    return arr.map((s) => `<span class="pill">${escapeHtml(s)}</span>`).join("");
  }

  function renderQuestions() {
    const tbody = $("q-table").querySelector("tbody");
    tbody.innerHTML = "";
    for (const q of state.questions) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(q.id)}</td>
        <td>${escapeHtml(q.type)}</td>
        <td>${escapeHtml((q.questionText || "").slice(0, 180))}${(q.questionText || "").length > 180 ? "..." : ""}</td>
        <td>${renderPills(q.knowledgePoints)}</td>
        <td>${renderPills(q.tags)}</td>
        <td>${escapeHtml(formatTime(q.updatedAt))}</td>
        <td>
          <button class="btn" data-act="edit" data-id="${escapeHtml(q.id)}">编辑</button>
          <button class="btn" data-act="delete" data-id="${escapeHtml(q.id)}">删除</button>
          <button class="btn" data-act="wrong" data-id="${escapeHtml(q.id)}">标记错题</button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  async function openEditorNew() {
    clearEditor();
    showEditor(true);
  }

  async function openEditorEdit(id) {
    const data = await api(`/api/console/questions/${encodeURIComponent(id)}`);
    const q = data.item;
    state.editingId = q.id;
    $("editor-title").textContent = `编辑题目：${q.id}`;
    $("f-type").value = q.type || "";
    $("f-source").value = q.source || "";
    $("f-question").value = q.questionText || "";
    $("f-options").value = stringifyOptions(q.options);
    $("f-answer").value = q.answer || "";
    $("f-knowledge").value = Array.isArray(q.knowledgePoints) ? q.knowledgePoints.join(", ") : "";
    $("f-tags").value = Array.isArray(q.tags) ? q.tags.join(", ") : "";
    $("editor-hint").textContent = "";
    showEditor(true);
  }

  async function saveEditor() {
    const payload = editorPayload();
    if (!payload.type || !payload.questionText) {
      $("editor-hint").textContent = "题型与题干必填";
      return;
    }
    $("editor-hint").textContent = "保存中...";
    try {
      if (state.editingId) {
        await api(`/api/console/questions/${encodeURIComponent(state.editingId)}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/console/questions", { method: "POST", body: JSON.stringify(payload) });
      }
      $("editor-hint").textContent = "已保存";
      showEditor(false);
      await loadQuestions();
      await refreshWrong();
      await refreshAnalytics();
    } catch (e) {
      $("editor-hint").textContent = `失败：${e.message}`;
    }
  }

  async function deleteQuestion(id) {
    if (!confirm("确认删除该题目？")) return;
    await api(`/api/console/questions/${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadQuestions();
    await refreshWrong();
    await refreshAnalytics();
  }

  async function markWrong(id) {
    await api(`/api/console/wrong/${encodeURIComponent(id)}`, { method: "POST" });
    await refreshWrong();
    await refreshAnalytics();
  }

  async function refreshWrong() {
    $("wrong-text").textContent = "加载中...";
    try {
      const data = await api("/api/console/wrong");
      $("wrong-text").textContent = `共 ${data.count} 条`;
      const tbody = $("wrong-table").querySelector("tbody");
      tbody.innerHTML = "";
      for (const it of data.items || []) {
        const q = it.question;
        const s = it.stat;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(q.type)}</td>
          <td>${escapeHtml((q.questionText || "").slice(0, 180))}${(q.questionText || "").length > 180 ? "..." : ""}</td>
          <td>${escapeHtml(s.wrongCount)}</td>
          <td>${escapeHtml(formatTime(s.lastWrongAt))}</td>
        `;
        tbody.appendChild(tr);
      }
    } catch (e) {
      $("wrong-text").textContent = `失败：${e.message}`;
    }
  }

  async function refreshAnalytics() {
    $("analytics-text").textContent = "加载中...";
    try {
      const data = await api("/api/console/analytics/knowledge");
      $("analytics-text").textContent = `共 ${data.count} 项`;
      const tbody = $("analytics-table").querySelector("tbody");
      tbody.innerHTML = "";
      for (const it of data.items || []) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(it.knowledgePoint)}</td>
          <td>${escapeHtml(it.wrongCount)}</td>
          <td>${escapeHtml(it.wrongQuestionCount)}</td>
        `;
        tbody.appendChild(tr);
      }
    } catch (e) {
      $("analytics-text").textContent = `失败：${e.message}`;
    }
  }

  function wireEvents() {
    $("btn-refresh-status").addEventListener("click", refreshStatus);
    $("btn-search").addEventListener("click", loadQuestions);
    $("q-query").addEventListener("keydown", (e) => {
      if (e.key === "Enter") loadQuestions();
    });
    $("btn-new").addEventListener("click", openEditorNew);
    $("btn-save").addEventListener("click", saveEditor);
    $("btn-cancel").addEventListener("click", () => {
      showEditor(false);
      clearEditor();
    });

    $("q-table").addEventListener("click", async (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const act = btn.getAttribute("data-act");
      const id = btn.getAttribute("data-id");
      try {
        if (act === "edit") await openEditorEdit(id);
        if (act === "delete") await deleteQuestion(id);
        if (act === "wrong") await markWrong(id);
      } catch (err) {
        alert(err.message);
      }
    });

    $("btn-refresh-wrong").addEventListener("click", refreshWrong);
    $("btn-refresh-analytics").addEventListener("click", refreshAnalytics);
  }

  async function init() {
    wireEvents();
    await refreshStatus();
    await loadQuestions();
    await refreshWrong();
    await refreshAnalytics();
  }

  init();
})();
