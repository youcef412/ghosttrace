// Gemma 4 through the Gemini API
const MODEL_NAME = "gemma-4-26b-a4b-it"; // alternative: "gemma-4-31b-it"
const RULES = `You are GhostTrace, an assistant that helps software developers resume their projects.
- Return ONLY one valid JSON object. No markdown, no code fences, no text before or after.
- Be concise: each string under 200 characters (except code_suggestion).
- Never invent file names or facts not present in the input. If unknown, use "" or [].
- Write in English.`;
// >>> PUT YOUR GEMINI API KEY BETWEEN THE QUOTES BELOW <<<
const API_KEY = "AQ.Ab8RN6Jc8YamQFSMoUfcxGr_V-oMlykCRG7BDrExewPr93qbHw";
const isDemo = () => false;
const apiKey = () => API_KEY;
const wait = ms => new Promise(r => setTimeout(r, ms));

async function askGemma(prompt, key, thinking = "minimal") {
  if (!key) throw new Error("Set your Gemini API key in js/ai.js (API_KEY).");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
  const send = body => fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(body) });
  const body = {
    systemInstruction: { parts: [{ text: RULES }] }, contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 2000, thinkingConfig: { thinkingLevel: thinking } }
  };
  let res;
  try { res = await send(body); } catch (e) { throw new Error("Network error. Check your wifi or turn on Demo mode."); }
  if (res.status === 400) {
    const t = await res.clone().text();
    if (/thinking|systemInstruction/i.test(t)) {
      console.warn("Retrying without thinkingConfig/systemInstruction:", t);
      res = await send({ contents: [{ parts: [{ text: RULES + "\n\n" + prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 2000 } });
    }
  }
  if (res.status === 401 || res.status === 403) throw new Error("The API key was rejected. Create a new key in AI Studio.");
  if (res.status === 429) throw new Error("Rate limit reached. Wait a minute or turn on Demo mode.");
  if (!res.ok) throw new Error("Gemma API error " + res.status + ": " + (await res.text()).slice(0, 200));
  const data = await res.json();
  return data.candidates[0].content.parts.map(p => p.text || "").join("");
}
function parseJSON(t) {
  t = t.replace(/```json|```/g, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  return JSON.parse(a >= 0 ? t.slice(a, b + 1) : t);
}
async function askJSON(prompt, thinking) {
  let t = await askGemma(prompt, apiKey(), thinking);
  try { return parseJSON(t); } catch (e) {
    t = await askGemma(prompt + "\n\nReturn only the JSON object.", apiKey(), thinking);
    try { return parseJSON(t); } catch (e2) { throw new Error("Gemma did not return valid JSON. Try again or turn on Demo mode."); }
  }
}
const kickoffPrompt = idea => `TASK: The developer is starting a new project. Analyze the idea.
PROJECT IDEA: ${idea}
Return JSON with exactly these keys:
{"summary": "2 sentences", "risks": ["max 3 technical risks"], "common_mistakes": ["max 4 mistakes beginners make on this kind of project"], "suggested_structure": ["file or folder paths for a clean structure, max 8"]}`;
const parkPrompt = (tree, notes) => `TASK: The developer is stopping work. Turn their notes into a structured snapshot.
FILE TREE: ${tree.join(", ")}
NOTES / ERROR: ${notes}
Return JSON with exactly these keys:
{"doing": "what they were working on", "problem": "what is broken, quoting the error if present", "tried": ["things already tried that did not work"], "next": "the single most useful next step", "suspect_file": "path of the file most likely containing the bug, chosen ONLY from the file tree, or empty string"}`;
const teleportPrompt = (s, path, content) => `TASK: The developer returns after days away. Rebuild their context and help fix the bug.
LAST SESSION: ${JSON.stringify({ doing: s.doing, problem: s.problem, tried: s.tried, next: s.next })}
SUSPECT FILE (${path}):
${content}
Return JSON with exactly these keys:
{"report": "3-sentence summary of the project state", "where_stopped": "one sentence", "mistake": "the likely cause of the bug, referencing the code above", "code_suggestion": "corrected code snippet (max 15 lines)", "dead_ends_reminder": "what not to retry, one sentence"}`;
const autofillPrompt = notes => `TASK: Extract these fields from the developer's messy notes.
NOTES: ${notes}
Return JSON: {"doing":"","problem":"","tried":[],"next":""}`;

// Public functions: real Gemma call, or mock data in Demo mode
async function kickoff(idea) {
  if (isDemo()) { await wait(600); return { summary: "Idea: " + idea.slice(0, 80) + ". Build one working core feature before adding extras.", risks: ["Scope too big for the time", "Unclear data model", "No early testing"], common_mistakes: ["Starting the UI before the data model", "Committing API keys", "No .gitignore", "Skipping input validation"], suggested_structure: ["app.py", "templates/", "static/", "requirements.txt", "README.md"] }; }
  return askJSON(kickoffPrompt(idea), "minimal");
}
async function park(tree, f) {
  if (isDemo()) { await wait(600); return { doing: f.doing || "Fixing the login page", problem: f.problem || "login returns 500 (KeyError 'password')", tried: f.tried.length ? f.tried : ["renamed the field", "print(request.form)"], next: f.next || "Check the name attribute of the password input", suspect_file: tree.find(p => /login\.html$/.test(p)) || tree.find(p => /\.(py|js)$/.test(p)) || "" }; }
  return askJSON(parkPrompt(tree, JSON.stringify(f)), "minimal");
}
async function autofill(notes) {
  if (isDemo()) { await wait(500); return { doing: "Fixing the login page", problem: notes.slice(0, 100), tried: ["renamed the field"], next: "Check the name attribute of the input" }; }
  return askJSON(autofillPrompt(notes), "minimal");
}
async function teleport(s, path, content) {
  if (isDemo()) { await wait(800); return { report: "You were building a small Flask stock app. Login fails with a 500 error because the form field name does not match what app.py reads. The database and register route work.", where_stopped: "Debugging the login form after the KeyError.", mistake: "In templates/login.html the password input is named \"pass\", but app.py reads request.form['password'], so Flask raises KeyError.", code_suggestion: "<input type=\"password\" name=\"password\" placeholder=\"Password\" required>", dead_ends_reminder: "Renaming the Python variable and printing request.form did not help. Fix the HTML name instead." }; }
  return askJSON(teleportPrompt(s, path, content), "high");
}
