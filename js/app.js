// Wiring: events -> storage / AI -> render
let pid = null, tried = [], root = null, tree = [];
const cur = () => (pid ? getProject(pid) : null);

function refresh() {
  const d = loadData();
  if (!pid || !d.projects.find(p => p.id === pid)) pid = d.projects[0] ? d.projects[0].id : null;
  renderProjects(d, pid); const p = cur();
  renderKickoff(p && p.kickoff); renderTimeline(p);
  const s = p && getLastSession(pid); tree = s ? s.fileTree || [] : []; renderTree(tree);
}
function ensureProject(def = "") {
  if (cur()) return cur();
  const n = prompt("Project name?", def); if (!n) return null;
  pid = addProject(n).id; renderProjects(loadData(), pid); return cur();
}
function show(tab) {
  document.querySelectorAll("main section").forEach(s => s.hidden = s.id !== "tab-" + tab);
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
}
const fields = () => ({ doing: $("doing").value, problem: $("problem").value, tried: tried.slice(), next: $("next").value, notes: $("aiNotes").value });

document.querySelectorAll("nav button").forEach(b => b.onclick = () => show(b.dataset.tab));
$("projectSelect").onchange = e => { pid = e.target.value; refresh(); };
$("newProjectBtn").onclick = () => { const n = prompt("Project name?"); if (n) { pid = addProject(n).id; refresh(); } };
$("bannerClose").onclick = () => $("banner").hidden = true;
setTimeout(() => $("banner").hidden = false, 90 * 60 * 1000);

$("startBtn").onclick = async () => {
  const idea = $("ideaInput").value.trim(); if (!idea) return showError("kickoffOut", "Describe your project first.");
  if (!ensureProject()) return;
  loading("kickoffOut");
  try { const k = await kickoff(idea); updateProject(pid, { idea, kickoff: k }); renderKickoff(k); }
  catch (e) { showError("kickoffOut", e.message); }
};
$("pickBtn").onclick = async () => {
  try {
    root = await pickFolder(); tree = await scanFolder(root); renderTree(tree);
    if (ensureProject(root.name)) await saveHandle(pid, root);
  } catch (e) { if (e.name !== "AbortError") showError("parkOut", "Could not read the folder. Use Chrome or Edge on desktop."); }
};
$("autofillBtn").onclick = async () => {
  const n = $("aiNotes").value.trim(); if (!n) return showError("parkOut", "Paste some notes first.");
  loading("parkOut");
  try {
    const r = await autofill(n); $("doing").value = r.doing || ""; $("problem").value = r.problem || "";
    $("next").value = r.next || ""; tried = Array.isArray(r.tried) ? r.tried : []; renderChips(tried); $("parkOut").innerHTML = "";
  } catch (e) { showError("parkOut", e.message); }
};
$("tried").onkeydown = e => {
  if (e.key === "Enter") { e.preventDefault(); const v = e.target.value.trim(); if (v) { tried.push(v); e.target.value = ""; renderChips(tried); } }
};
$("chips").onclick = e => { const i = e.target.dataset.i; if (i !== undefined) { tried.splice(+i, 1); renderChips(tried); } };
$("parkForm").onsubmit = async e => {
  e.preventDefault(); if (!ensureProject()) return;
  const f = fields(); loading("parkOut");
  try {
    const r = await park(tree, f);
    addSession(pid, { doing: r.doing || f.doing, problem: r.problem || f.problem, tried: Array.isArray(r.tried) && r.tried.length ? r.tried : f.tried, next: r.next || f.next, suspect_file: r.suspect_file || "", fileTree: tree });
    $("parkOut").innerHTML = '<div class="card">✅ Parked. See you later!</div>';
    $("parkForm").reset(); tried = []; renderChips(tried); renderTimeline(cur());
  } catch (err) { showError("parkOut", err.message); }
};
$("teleportBtn").onclick = async () => {
  const s = pid && getLastSession(pid);
  if (!s) return $("teleportCard").innerHTML = '<div class="empty">No sessions yet - park your first one</div>';
  loading("teleportCard"); let content = "";
  try {
    if (!isDemo() && s.suspect_file) {
      try { const h = await getHandle(pid); if (!h || !(await ensurePermission(h))) throw 0; content = await readFileFromHandle(h, s.suspect_file); }
      catch (x) { try { content = await pickFileManually(); } catch (y) { content = "(file not available)"; } }
    }
    renderTeleport(s, await teleport(s, s.suspect_file, content));
  } catch (e) { showError("teleportCard", e.message); }
};
$("teleportCard").onclick = e => { if (e.target.classList.contains("copy")) navigator.clipboard.writeText($("codeBlock").textContent); };
$("timeline").onclick = e => { const sid = e.target.dataset.sid; if (sid) { toggleResolved(pid, sid); renderTimeline(cur()); } };
$("exportBtn").onclick = exportJSON;
$("importFile").onchange = async e => { try { await importJSON(e.target.files[0]); refresh(); } catch (x) { alert("Could not import: " + x.message); } };
refresh();
