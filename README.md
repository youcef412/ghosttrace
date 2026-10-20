# 👻 GhostTrace
A "save game" for your coding projects: park your progress in 30 seconds, then one click shows where you stopped, what failed and the likely fix.
**Powered by Gemma 4 (`gemma-4-26b-a4b-it`) via the Gemini API.** Uses Gemma 4 system instructions and thinking levels (minimal/high). Everything else runs in your browser (HTML/CSS/JS, localStorage, IndexedDB).

## Run
1. Get a key at https://aistudio.google.com/apikey and put it in `js/ai.js` (the `API_KEY` constant near the top).
2. Open `index.html` with VS Code Live Server (or any local server). Use Chrome or Edge on desktop.
4. Deploy: GitHub repo, Settings, Pages, Deploy from branch `main` / root.

## VS Code auto-launch
`demo-project/.vscode/tasks.json` runs on `folderOpen` and opens GhostTrace in your browser. Copy it into any project and set the URL. VS Code asks once to "Allow Automatic Tasks". Limitation: a web page cannot detect when you leave the editor, so you park with the **Park it** button (a reminder banner appears after 90 minutes).

## 2-minute demo
1. Open `demo-project/` in VS Code: GhostTrace pops up.
2. Kickoff: describe the idea, Gemma returns summary, risks and structure.
3. Park it: choose the `demo-project` folder, add the error, park.
4. Click **Load demo data** (simulates 3 days later), then **Teleport Me Back**: the report points to `name="pass"` vs `request.form['password']`.

## Next steps
A real VS Code extension, an import graph view, Gemma function calling so it chooses which file to read, local Gemma through Ollama.
