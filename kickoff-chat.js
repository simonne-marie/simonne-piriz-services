// Kickoff chat: the Kickoff Brief as a conversation. The server (worker/index.js) relays each turn to Claude;
// answers land in the same draft as the form, so visitors can switch between the two at any point.
import { DRAFT_KEY, STYLES, FONTS, PALETTES, MOODS, VOICES, SCALES, createKickoff } from "./kickoff-core.js";

(() => {
  const logEl = document.getElementById("chat-log");
  if (!logEl) return;

  const CHAT_KEY = "sp-kickoff-chat-v1";
  const ENDPOINT = "/api/kickoff-chat";

  /* ---------- State ---------- */
  let a = {};
  let formStep = 0;
  let chat = { messages: [], log: [] }; // messages: what Claude sees; log: what the page shows
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (saved && saved.a) { a = saved.a; formStep = saved.step || 0; }
    const savedChat = JSON.parse(localStorage.getItem(CHAT_KEY));
    if (savedChat && Array.isArray(savedChat.messages)) chat = savedChat;
  } catch (e) {}
  const save = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ a, step: formStep }));
      localStorage.setItem(CHAT_KEY, JSON.stringify(chat));
    } catch (e) {}
  };

  // A reply that never arrived (page closed mid-turn) leaves a dangling visitor turn; drop it.
  if (chat.messages.length && chat.messages[chat.messages.length - 1].role === "user") {
    chat.messages.pop();
    const lastLog = chat.log[chat.log.length - 1];
    if (lastLog && lastLog.who === "me") chat.log.pop();
  }

  const k = createKickoff(a);
  const { allQs, qOn, filled, optVal, optLabel, esc, field, brief, sendToHubSpot } = k;
  const byId = Object.fromEntries(allQs.map((q) => [q.id, q]));

  // Calculator picks arrive the same way as on the form: /kickoff-chat?services=Website|Brand Foundation&manage=...
  const params = new URLSearchParams(window.location.search);
  const listParam = (key) => (params.get(key) || "").split("|").map((s) => s.trim()).filter(Boolean);
  if (params.get("services") && !(a.path_services || []).length) a.path_services = listParam("services");
  if (params.get("seats") && !(a.path_seats || []).length) a.path_seats = listParam("seats");
  ["tier", "manage", "brand"].forEach((key) => { if (params.get(key) && !a["path_" + key]) a["path_" + key] = params.get(key); });

  const inputEl = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const statusEl = document.getElementById("chat-status");
  const reviewEl = document.getElementById("chat-review");

  /* ---------- Turning answers into words ---------- */
  const labelFor = (q, v) => { const o = (q.opts || []).find((x) => optVal(x) === v); return o ? optLabel(o) : v; };
  function describe(q) {
    const v = a[q.id];
    const verdicts = (list) => [["love", "Love it"], ["open", "Open to it"], ["no", "Not us"]]
      .map(([key, l]) => { const names = list.filter((s) => (v || {})[s.id] === key).map((s) => s.name); return names.length ? `${l}: ${names.join(", ")}` : ""; })
      .filter(Boolean).join(". ");
    switch (q.t) {
      case "chips": return q.multi ? (v || []).map((x) => labelFor(q, x)).join(", ") : labelFor(q, v || "");
      case "styles": return verdicts(STYLES);
      case "fonts": return verdicts(FONTS);
      case "palettes": return verdicts(PALETTES);
      case "voice": { const vo = VOICES.find((x) => x.id === v); return vo ? vo.name : ""; }
      case "moods": return (v || []).map((id) => MOODS.find((m) => m.id === id).name).join(", ");
      case "scales": return SCALES.filter(([key]) => (v || {})[key]).map(([key, l, r]) => `${l} to ${r}: ${v[key]} of 5`).join(", ");
      case "refs": return (v || []).filter((r) => r.url.trim()).map((r) => `${r.url} (${r.v === "love" ? "love it" : "not for me"}${r.note ? ": " + r.note : ""})`).join("; ");
    }
    return String(v || "");
  }

  // Answers the assistant recorded from what the visitor typed. Choice answers must match an option exactly.
  function applyAnswers(list) {
    (list || []).forEach(({ id, value }) => {
      const q = byId[id];
      if (!q || typeof value !== "string") return;
      if (q.t === "chips") {
        const valid = new Set(q.opts.map(optVal));
        if (q.multi) {
          const picks = value.split("|").map((s) => s.trim()).filter((s) => valid.has(s));
          if (picks.length) a[id] = picks;
        } else if (valid.has(value.trim())) a[id] = value.trim();
      } else {
        a[id] = value.trim();
      }
    });
  }

  /* ---------- Rendering ---------- */
  const bubble = (who, html) => `<div class="chat-msg chat-${who}"><div class="chat-bubble">${html}</div></div>`;
  const paragraphs = (text) => esc(text).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");

  function widgetHtml(qid, i) {
    const q = byId[qid];
    if (!q) return "";
    const hint = q.multi || ["styles", "fonts", "palettes", "moods"].includes(q.t) ? "Pick as many as you like, then press Send." : "";
    return `<div class="chat-widget form-field" data-widget="${qid}" data-log="${i}">
      ${hint ? `<p class="k-help">${hint}</p>` : ""}${field(q)}
      <div class="chat-widget-actions"><button type="button" class="btn chat-widget-send" data-widget-send="${qid}">Send</button>
      <button type="button" class="k-link" data-widget-skip="${qid}">I’d rather type it</button></div></div>`;
  }

  function render() {
    logEl.innerHTML = chat.log.map((item, i) => {
      if (item.who === "me") return bubble("me", paragraphs(item.text));
      const widget = item.show && item.show !== "none" && item.open ? widgetHtml(item.show, i) : "";
      return bubble("bot", paragraphs(item.text)) + widget;
    }).join("");
    const last = chat.log[chat.log.length - 1];
    reviewEl.hidden = !(last && last.done);
    if (!reviewEl.hidden) renderReview();
    logEl.scrollTop = logEl.scrollHeight;
  }

  function renderReview() {
    const missing = allQs.filter((q) => q.need && qOn(q) && !filled(q));
    const contactOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((a.email || "").trim()) && (a.biz_name || "").trim();
    document.getElementById("chat-brief").textContent = brief({ via: "chat" });
    document.getElementById("chat-missing").innerHTML = !contactOk
      ? "<strong>Before sending:</strong> I still need your email and business name. Add them in the chat."
      : missing.length ? `<strong>Still open:</strong> ${missing.map((q) => esc(q.b || q.label)).join(", ")}. You can send now, and we’ll cover these on the kickoff call.` : "<strong>Everything I need is here.</strong>";
    document.getElementById("chat-submit").disabled = !contactOk;
  }

  function setBusy(busy) {
    sendBtn.disabled = busy;
    inputEl.disabled = busy;
    document.getElementById("chat-typing").hidden = !busy;
    if (busy) logEl.scrollTop = logEl.scrollHeight;
  }

  function showStatus(text, isError = true) {
    statusEl.className = "form-status" + (text ? (isError ? " is-error" : " is-success") : "");
    statusEl.innerHTML = text;
  }

  /* ---------- Talking to the server ---------- */
  function parseReply(content) {
    const text = (content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    try {
      const r = JSON.parse(text);
      if (typeof r.message === "string") return r;
    } catch (e) {}
    return { message: text || "Sorry, I lost my train of thought. Could you say that again?", answers: [], show: "none", done: false };
  }

  async function send(text, { visible = true } = {}) {
    showStatus("");
    chat.messages.push({ role: "user", content: text });
    if (visible) chat.log.push({ who: "me", text: text.replace(/^\[Selected\] /, "") });
    chat.log.forEach((item) => { item.open = false; });
    render();
    setBusy(true);
    try {
      const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: chat.messages }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data.error || "error"), { code: data.error, status: res.status });
      if (data.stop_reason === "refusal") throw Object.assign(new Error("refusal"), { code: "refusal" });
      chat.messages.push({ role: "assistant", content: data.content });
      const reply = parseReply(data.content);
      applyAnswers(reply.answers);
      chat.log.push({ who: "bot", text: reply.message, show: reply.show, open: true, done: !!reply.done });
      save();
      render();
    } catch (err) {
      // Take the turn back so the conversation stays in order, and give the text back to retype.
      chat.messages.pop();
      if (visible) { chat.log.pop(); inputEl.value = text.startsWith("[Selected]") ? "" : text; }
      const last = chat.log[chat.log.length - 1];
      if (last) last.open = true;
      render();
      const messages = {
        not_configured: 'The chat isn’t available right now. Please use the <a href="/kickoff">Kickoff Brief form</a> instead; your answers so far come with you.',
        rate_limited: "That was a lot of messages at once. Wait a minute, then try again.",
        busy: "The chat is busy right now. Wait a moment, then try again.",
        refusal: "I can’t help with that one. Could you put it another way?",
        too_long: 'This conversation has gotten too long for the chat. Please finish in the <a href="/kickoff">Kickoff Brief form</a>; your answers so far come with you.',
      };
      showStatus(messages[err.code] || 'Something went wrong. Try again, or switch to the <a href="/kickoff">Kickoff Brief form</a>; your answers so far come with you.');
    } finally {
      setBusy(false);
      if (!inputEl.disabled) inputEl.focus();
    }
  }

  function start() {
    const picks = [
      (a.path_services || []).length && `services: ${a.path_services.join(", ")}`,
      a.path_tier && `website build: ${a.path_tier}`,
      a.path_manage && `after launch: ${a.path_manage}`,
      (a.path_seats || []).length && `team seats: ${a.path_seats.join(", ")}`,
    ].filter(Boolean);
    const known = allQs.filter((q) => ["text", "email", "area", "chips"].includes(q.t) && filled(q))
      .map((q) => `${q.id}: ${Array.isArray(a[q.id]) ? a[q.id].join(" | ") : a[q.id]}`);
    let opening = "Hi, I’d like to start my Kickoff Brief.";
    if (picks.length) opening += ` From the Investment calculator I picked ${picks.join("; ")}.`;
    if (known.length > picks.length) opening += `\n\nAnswers I already gave on the form:\n${known.join("\n")}`;
    send(opening, { visible: false });
  }

  /* ---------- Events ---------- */
  document.getElementById("chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text || sendBtn.disabled) return;
    inputEl.value = "";
    send(text);
  });
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); document.getElementById("chat-form").requestSubmit(); }
  });

  logEl.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.q) a[t.dataset.q] = t.value;
    else if (t.dataset.scale) a.brand_scales = { ...(a.brand_scales || {}), [t.dataset.scale]: +t.value };
    else if (t.dataset.ref && t.tagName === "INPUT") {
      const list = [...(a.vis_refs || [{ url: "", note: "", v: "love" }])];
      list[+t.dataset.ref] = { ...list[+t.dataset.ref], [t.dataset.k]: t.value };
      a.vis_refs = list;
    }
    save();
  });
  logEl.addEventListener("change", (e) => {
    const t = e.target;
    if (t.tagName === "SELECT" && t.dataset.ref) {
      const list = [...(a.vis_refs || [{ url: "", note: "", v: "love" }])];
      list[+t.dataset.ref] = { ...list[+t.dataset.ref], v: t.value };
      a.vis_refs = list;
      save();
    }
  });
  logEl.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const rerenderWidget = () => {
      const w = b.closest(".chat-widget");
      const fresh = document.createElement("div");
      fresh.innerHTML = widgetHtml(w.dataset.widget, w.dataset.log);
      w.replaceWith(fresh.firstElementChild);
    };
    if (b.dataset.chip) {
      const q = byId[b.dataset.chip], v = b.dataset.val;
      if (q.multi) {
        const cur = [...(a[q.id] || [])], i = cur.indexOf(v);
        i >= 0 ? cur.splice(i, 1) : cur.push(v);
        a[q.id] = cur;
      } else {
        a[q.id] = a[q.id] === v ? "" : v;
      }
      save();
      if (q.multi) rerenderWidget();
      else { a[q.id] && send(`[Selected] ${describe(q)}`); }
    } else if (b.dataset.voice) {
      a.brand_voice = b.dataset.voice;
      save();
      send(`[Selected] ${describe(byId.brand_voice)}`);
    } else if (b.dataset.card) {
      const sv = { ...(a[b.dataset.card] || {}) }, id = b.dataset.id, v = b.dataset.v;
      if (sv[id] === v) delete sv[id]; else sv[id] = v;
      a[b.dataset.card] = sv;
      save();
      rerenderWidget();
    } else if (b.dataset.mood) {
      const cur = [...(a.vis_colors || [])], i = cur.indexOf(b.dataset.mood);
      i >= 0 ? cur.splice(i, 1) : cur.push(b.dataset.mood);
      a.vis_colors = cur;
      save();
      rerenderWidget();
    } else if (b.hasAttribute("data-addref")) {
      a.vis_refs = [...(a.vis_refs || [{ url: "", note: "", v: "love" }]), { url: "", note: "", v: "love" }];
      save();
      rerenderWidget();
    } else if (b.dataset.delref != null) {
      const list = [...(a.vis_refs || [])];
      list.splice(+b.dataset.delref, 1);
      a.vis_refs = list;
      save();
      rerenderWidget();
    } else if (b.dataset.widgetSend) {
      const q = byId[b.dataset.widgetSend];
      const said = describe(q);
      send(said ? `[Selected] ${said}` : "[Selected] Nothing picked. Let’s skip this one.");
    } else if (b.dataset.widgetSkip) {
      const item = chat.log[+b.closest(".chat-widget").dataset.log];
      if (item) item.open = false;
      render();
      inputEl.focus();
    }
  });

  document.getElementById("chat-keep").addEventListener("click", () => {
    const last = chat.log[chat.log.length - 1];
    if (last) last.done = false;
    save();
    render();
    inputEl.focus();
  });

  document.getElementById("chat-submit").addEventListener("click", async () => {
    const submitBtn = document.getElementById("chat-submit");
    const reviewStatus = document.getElementById("chat-review-status");
    if (document.getElementById("chat-hp").value) return; // bot
    if (!document.getElementById("chat-consent").checked) {
      reviewStatus.className = "form-status is-error";
      reviewStatus.textContent = "Please check the box to agree before sending.";
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    try {
      await sendToHubSpot({ via: "chat" });
      try { localStorage.removeItem(DRAFT_KEY); localStorage.removeItem(CHAT_KEY); } catch (e) {}
      document.getElementById("chat-app").hidden = true;
      document.getElementById("kick-done").hidden = false;
    } catch (err) {
      reviewStatus.className = "form-status is-error";
      reviewStatus.textContent = "Something went wrong sending that. Your answers are still saved here. Try again, or email simonnemv@gmail.com.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Send my Kickoff Brief";
    }
  });

  document.getElementById("chat-restart").addEventListener("click", () => {
    const bar = document.getElementById("chat-restart-confirm");
    bar.hidden = false;
  });
  document.getElementById("chat-restart-no").addEventListener("click", () => { document.getElementById("chat-restart-confirm").hidden = true; });
  document.getElementById("chat-restart-yes").addEventListener("click", () => {
    Object.keys(a).forEach((key) => delete a[key]);
    chat = { messages: [], log: [] };
    formStep = 0;
    save();
    document.getElementById("chat-restart-confirm").hidden = true;
    render();
    start();
  });

  render();
  if (!chat.messages.length) start();
})();
