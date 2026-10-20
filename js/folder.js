// Folder access (File System Access API, Chrome/Edge)
const IGNORE = ["node_modules", ".git", "dist", "build", ".vscode", "__pycache__"];
const pickFolder = () => window.showDirectoryPicker({ mode: "read" });
async function scanFolder(dir, prefix = "", depth = 0, out = []) {
  if (depth > 4) return out;
  for await (const [name, h] of dir.entries()) {
    if (IGNORE.includes(name)) continue;
    if (h.kind === "directory") { out.push(prefix + name + "/"); await scanFolder(h, prefix + name + "/", depth + 1, out); }
    else if ((await h.getFile()).size <= 100 * 1024) out.push(prefix + name);
  }
  return out;
}
async function ensurePermission(h) {
  if ((await h.queryPermission({ mode: "read" })) === "granted") return true;
  return (await h.requestPermission({ mode: "read" })) === "granted";
}
async function readFileFromHandle(root, path) {
  const parts = path.split("/"); let d = root;
  for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p);
  return (await (await d.getFileHandle(parts[parts.length - 1])).getFile()).text();
}
async function pickFileManually() { const [fh] = await window.showOpenFilePicker(); return (await fh.getFile()).text(); }
