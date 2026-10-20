// Storage: localStorage for data, IndexedDB for folder handles
const KEY = "ghosttrace";
const uid = () => Math.random().toString(36).slice(2, 9);
function loadData() { try { return JSON.parse(localStorage.getItem(KEY)) || { projects: [] }; } catch (e) { return { projects: [] }; } }
function saveData(d) { localStorage.setItem(KEY, JSON.stringify(d)); }
function getProject(id) { return loadData().projects.find(p => p.id === id); }
function addProject(name, idea = "") {
  const d = loadData(); const p = { id: uid(), name, idea, kickoff: null, sessions: [] };
  d.projects.push(p); saveData(d); return p;
}
function updateProject(id, patch) { const d = loadData(); const p = d.projects.find(x => x.id === id); Object.assign(p, patch); saveData(d); return p; }
function addSession(pid, s) {
  const d = loadData(); const p = d.projects.find(x => x.id === pid);
  const ses = { id: uid(), date: new Date().toISOString(), resolved: false, ...s };
  p.sessions.push(ses); saveData(d); return ses;
}
function getLastSession(pid) { const p = getProject(pid); return p && p.sessions.length ? p.sessions[p.sessions.length - 1] : null; }
function toggleResolved(pid, sid) {
  const d = loadData(); const s = d.projects.find(p => p.id === pid).sessions.find(x => x.id === sid);
  s.resolved = !s.resolved; saveData(d);
}
function loadDemoData() {
  const d = loadData(); const day = 864e5, now = Date.now();
  const iso = n => new Date(now - n * day).toISOString();
  const tree = ["app.py", "templates/", "templates/login.html", "templates/register.html", "requirements.txt"];
  const demo = { id: "demo", name: "gestion-stock (demo)", idea: "Flask app to manage stock for a small shop", kickoff: null, sessions: [
    { id: "s1", date: iso(3), doing: "Database connected", problem: "", tried: [], next: "Build the register route", suspect_file: "app.py", resolved: true, fileTree: tree },
    { id: "s2", date: iso(2), doing: "Register route works", problem: "", tried: [], next: "Build the login page", suspect_file: "app.py", resolved: true, fileTree: tree },
    { id: "s3", date: iso(1), doing: "Fixing the login page", problem: "login returns 500 (KeyError 'password')", tried: ["renamed the field", "print(request.form)"], next: "Check name=\"...\" in the HTML input", suspect_file: "templates/login.html", resolved: false, fileTree: tree }
  ] };
  d.projects = d.projects.filter(p => p.id !== "demo"); d.projects.push(demo); saveData(d); return demo;
}
function exportJSON() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(loadData(), null, 2)], { type: "application/json" }));
  a.download = "ghosttrace-data.json"; a.click();
}
function importJSON(file) {
  return file.text().then(t => { const d = JSON.parse(t); if (!Array.isArray(d.projects)) throw new Error("Invalid file"); saveData(d); });
}
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open("ghosttrace-db", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("handles");
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function saveHandle(id, h) { const db = await idb(); return new Promise(res => { const t = db.transaction("handles", "readwrite"); t.objectStore("handles").put(h, id); t.oncomplete = res; }); }
async function getHandle(id) { const db = await idb(); return new Promise(res => { const r = db.transaction("handles").objectStore("handles").get(id); r.onsuccess = () => res(r.result); r.onerror = () => res(null); }); }
