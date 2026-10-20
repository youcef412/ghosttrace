// Rendering helpers
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const list = a => "<ul>" + (a || []).map(x => `<li>${esc(x)}</li>`).join("") + "</ul>";
function timeAgo(iso) { const d = Math.floor((Date.now() - new Date(iso)) / 864e5); return d <= 0 ? "today" : d === 1 ? "1 day ago" : d + " days ago"; }
const loading = el => { $(el).innerHTML = '<div class="spin" role="status" aria-label="Loading"></div>'; };
const showError = (el, m) => { $(el).innerHTML = `<div class="err">⚠️ ${esc(m)}</div>`; };
function renderProjects(data, cur) {
  $("projectSelect").innerHTML = data.projects.length
    ? data.projects.map(p => `<option value="${p.id}" ${p.id === cur ? "selected" : ""}>${esc(p.name)}</option>`).join("")
    : '<option value="">No project yet</option>';
}
function renderKickoff(k) {
  $("kickoffOut").innerHTML = k ? `<div class="card"><h3>Summary</h3><p>${esc(k.summary)}</p></div>
  <div class="card"><h3>Risks</h3>${list(k.risks)}</div><div class="card"><h3>Common mistakes to avoid</h3>${list(k.common_mistakes)}</div>
  <div class="card"><h3>Suggested file structure</h3><pre>${esc((k.suggested_structure || []).join("\n"))}</pre></div>` : "";
}
function renderTree(paths) {
  $("tree").innerHTML = (paths || []).slice().sort().map(p => {
    const parts = p.split("/").filter(Boolean), name = parts.pop(), dir = p.endsWith("/");
    const ico = dir ? "📁" : /\.py$/.test(name) ? "🐍" : /\.(js|ts)$/.test(name) ? "🟨" : /\.html?$/.test(name) ? "🌐" : /\.css$/.test(name) ? "🎨" : "📄";
    return `<div style="padding-left:${parts.length * 16}px">${ico} ${esc(name)}</div>`;
  }).join("");
}
function renderChips(tried) {
  $("chips").innerHTML = tried.map((t, i) => `<span class="chip">${esc(t)}<button type="button" data-i="${i}" aria-label="Remove">✕</button></span>`).join("");
}
function renderTimeline(p) {
  const ss = p ? p.sessions.slice().reverse() : [];
  $("timeline").innerHTML = ss.length ? ss.map(s => `<div class="item"><span class="dot ${s.resolved ? "green" : "red"}"></span>
    <div><strong>${esc(s.doing || "Session")}</strong><small>${new Date(s.date).toLocaleString()} · next: ${esc(s.next)}</small></div>
    <button data-sid="${s.id}">${s.resolved ? "Reopen" : "Mark resolved"}</button></div>`).join("")
    : '<div class="empty">No sessions yet - park your first one</div>';
}
function renderTeleport(s, r) {
  $("teleportCard").innerHTML = `<div class="card"><small>Last session: ${new Date(s.date).toLocaleString()} · ${timeAgo(s.date)}</small>
  <p><strong>You were:</strong> ${esc(s.doing)}</p><p>${esc(r.report)} ${esc(r.where_stopped)}</p></div>
  <div class="box broken"><h3>BROKEN</h3>${esc(s.problem || "Nothing recorded")}</div>
  <div class="box dead"><h3>DEAD ENDS - don't retry</h3>${list(s.tried)}<p>${esc(r.dead_ends_reminder)}</p></div>
  <div class="box"><h3>THE MISTAKE</h3>${esc(r.mistake)}<pre id="codeBlock">${esc(r.code_suggestion)}</pre><button class="copy">Copy fix</button></div>
  <div class="box start"><h3>START HERE</h3>${esc(s.next)}</div>`;
}
