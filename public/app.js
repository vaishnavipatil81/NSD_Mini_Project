const form = document.querySelector("#complaintForm");
const message = document.querySelector("#formMessage");
const reportsList = document.querySelector("#reportsList");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const refreshBtn = document.querySelector("#refreshBtn");
const themeToggle = document.querySelector("#themeToggle");

const esc = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));

function statusClass(status) {
  if (status === "Resolved") return "badge-resolved";
  if (status === "In Progress") return "badge-progress";
  return "badge-open";
}

function dateLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

async function loadStats() {
  const stats = await api("/api/stats");
  document.querySelector("#totalCount").textContent = stats.total;
  document.querySelector("#openCount").textContent = stats.open;
  document.querySelector("#progressCount").textContent = stats.inProgress;
  document.querySelector("#resolvedCount").textContent = stats.resolved;
}

function renderCategoryChart(items = []) {
  const target = document.querySelector("#categoryChart");
  if (!items.length) {
    target.innerHTML = '<p class="chart-empty">No complaint data yet. Add a report to see category insights.</p>';
    return;
  }
  const max = Math.max(...items.map(item => item.count), 1);
  target.innerHTML = items.map(item => `
    <div class="bar-row"><div class="bar-label"><span>${esc(item.name)}</span><strong>${item.count}</strong></div>
      <div class="bar-track"><span class="bar-fill" style="width:${Math.max(4, item.count / max * 100)}%"></span></div>
    </div>`).join("");
}

function renderMonthlyChart(items = []) {
  const target = document.querySelector("#monthlyChart");
  if (!items.length) {
    target.innerHTML = '<p class="chart-empty">No monthly data yet. Add a report to begin the trend.</p>';
    return;
  }
  const max = Math.max(...items.map(item => item.count), 1);
  target.innerHTML = `<div class="monthly-bars">${items.map(item => {
    const label = new Date(`${item.month}-01T12:00:00`).toLocaleDateString([], { month: "short", year: "2-digit" });
    return `<div class="month-column"><strong>${item.count}</strong><div class="month-track"><span style="height:${Math.max(7, item.count / max * 100)}%"></span></div><small>${esc(label)}</small></div>`;
  }).join("")}</div>`;
}

async function loadAnalytics() {
  try {
    const analytics = await api("/api/analytics");
    renderCategoryChart(analytics.categories);
    renderMonthlyChart(analytics.monthly);
    const average = document.querySelector("#avgResolution");
    const hint = document.querySelector("#resolutionHint");
    if (analytics.averageResolutionHours === null) {
      average.textContent = "—";
      hint.textContent = "Resolve a complaint to calculate an average";
    } else if (analytics.averageResolutionHours < 24) {
      average.textContent = `${analytics.averageResolutionHours} hrs`;
      hint.textContent = `Based on ${analytics.resolvedMeasured} resolved report(s)`;
    } else {
      average.textContent = `${(analytics.averageResolutionHours / 24).toFixed(1)} days`;
      hint.textContent = `Based on ${analytics.resolvedMeasured} resolved report(s)`;
    }
  } catch (error) {
    document.querySelector("#categoryChart").innerHTML = `<p class="chart-empty">${esc(error.message)}</p>`;
    document.querySelector("#monthlyChart").innerHTML = '<p class="chart-empty">Analytics unavailable</p>';
  }
}

function timelineFor(report) {
  if (Array.isArray(report.statusHistory) && report.statusHistory.length) return report.statusHistory;
  // Backward compatibility for complaints created before timeline support was added.
  const history = [{ status: "Open", note: "Complaint submitted", changedAt: report.createdAt }];
  if (report.status && report.status !== "Open") {
    history.push({ status: report.status, note: report.adminNote || `Current status: ${report.status}`, changedAt: report.updatedAt || report.createdAt });
  }
  return history;
}

function renderTimeline(report) {
  const history = timelineFor(report);
  return `<details class="timeline-details"><summary>View progress timeline <span>${history.length} update${history.length === 1 ? "" : "s"}</span></summary>
    <ol class="timeline">${history.map((item, index) => `
      <li class="timeline-item ${index === history.length - 1 ? "timeline-current" : ""}">
        <span class="timeline-dot"></span><div class="timeline-content"><div class="timeline-line"><strong>${esc(item.status || "Update")}</strong><time>${esc(dateLabel(item.changedAt))}</time></div>
        <p>${esc(item.note || (item.status === "Open" ? "Complaint submitted" : `Status changed to ${item.status}`))}</p></div>
      </li>`).join("")}</ol></details>`;
}

async function loadReports() {
  reportsList.innerHTML = '<div class="empty-state">Loading reports…</div>';
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
  if (statusFilter.value !== "All") params.set("status", statusFilter.value);
  try {
    const reports = await api(`/api/complaints?${params.toString()}`);
    if (!reports.length) {
      reportsList.innerHTML = '<div class="empty-state">No reports found. Submit the first campus issue.</div>';
      return;
    }
    reportsList.innerHTML = reports.map(report => `
      <article class="report-card">
        <div class="report-top">
          <div><p class="report-title">${esc(report.title)}</p><span class="ticket">${esc(report.ticketId)}</span></div>
          <span class="badge ${statusClass(report.status)}">${esc(report.status)}</span>
        </div>
        <p class="report-meta">${esc(report.category)} · ${esc(report.location)}<br>Reported by ${esc(report.studentName)} · ${esc(dateLabel(report.createdAt))}<br>Priority: <strong>${esc(report.priority)}</strong></p>
        <p class="report-description">${esc(report.description)}</p>
        ${report.adminNote ? `<p class="report-description"><strong>Admin note:</strong> ${esc(report.adminNote)}</p>` : ""}
        ${renderTimeline(report)}
        <div class="report-actions">
          <select aria-label="Update status for ${esc(report.ticketId)}" data-status="${esc(report._id)}">
            ${["Open", "In Progress", "Resolved"].map(status => `<option ${status === report.status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
          <button type="button" data-update="${esc(report._id)}">Update</button>
          <button type="button" class="delete-btn" data-delete="${esc(report._id)}">Delete</button>
        </div>
      </article>`).join("");
  } catch (error) {
    reportsList.innerHTML = `<div class="empty-state">${esc(error.message)} Check that the server and MongoDB are running.</div>`;
  }
}

async function refresh() {
  await Promise.all([loadStats(), loadReports(), loadAnalytics()]);
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  message.textContent = "Submitting your report…";
  message.classList.remove("error");
  const body = Object.fromEntries(new FormData(form).entries());
  try {
    const created = await api("/api/complaints", { method: "POST", body: JSON.stringify(body) });
    form.reset();
    message.textContent = `Report submitted! Your ticket ID is ${created.ticketId}.`;
    await refresh();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  }
});

reportsList.addEventListener("click", async event => {
  const updateId = event.target.dataset.update;
  const deleteId = event.target.dataset.delete;
  try {
    if (updateId) {
      const select = reportsList.querySelector(`[data-status="${CSS.escape(updateId)}"]`);
      const status = select.value;
      let adminNote = "";
      if (status === "In Progress" || status === "Resolved") {
        adminNote = window.prompt("Optional note for the student:", "") || "";
      }
      await api(`/api/complaints/${encodeURIComponent(updateId)}/status`, {
        method: "PATCH", body: JSON.stringify({ status, adminNote })
      });
      await refresh();
    }
    if (deleteId) {
      if (!window.confirm("Delete this complaint permanently?")) return;
      await api(`/api/complaints/${encodeURIComponent(deleteId)}`, { method: "DELETE" });
      await refresh();
    }
  } catch (error) {
    window.alert(error.message);
  }
});

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  themeToggle.innerHTML = dark ? "☀️ <span>Light mode</span>" : "🌙 <span>Dark mode</span>";
  themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}

const savedTheme = localStorage.getItem("campuscare-theme");
applyTheme(savedTheme === "dark" ? "dark" : "light");
themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("campuscare-theme", nextTheme);
  applyTheme(nextTheme);
});

let searchTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadReports, 250);
});
statusFilter.addEventListener("change", loadReports);
refreshBtn.addEventListener("click", refresh);

refresh();
