// Studio guide: a scripted chat. It asks what visitors need, suggests a starting point from our services,
// answers questions about the studio, and can run the Kickoff Brief one question at a time.
// Nothing here calls an AI. Every reply comes from guide-content.js or the brief's own questions in kickoff-core.js.
import { DRAFT_KEY, STYLES, FONTS, PALETTES, MOODS, VOICES, SCALES, createKickoff } from "./kickoff-core.js";
import { GREETING, FALLBACK, TOPICS, matchTopic, NEEDS, DISCOVERY, suggestion, contactLink } from "./guide-content.js";

(() => {
  const logEl = document.getElementById("chat-log");
  if (!logEl) return;

  const GUIDE_KEY = "sp-guide-v1";

  /* ---------- State ---------- */
  let a = {};
  let formStep = 0;
  // log: what the page shows. mode: disc (first questions), brief, review, open (free questions).
  // cur: the question being asked. skipped: questions passed over in the brief.
  const fresh = () => ({ log: [], mode: "disc", cur: null, skipped: [] });
  let g = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (saved && saved.a) { a = saved.a; formStep = saved.step || 0; }
    const savedGuide = JSON.parse(localStorage.getItem(GUIDE_KEY));
    if (savedGuide && Array.isArray(savedGuide.log)) g = { ...fresh(), ...savedGuide };
  } catch (e) {}
  const save = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ a, step: formStep }));
      localStorage.setItem(GUIDE_KEY, JSON.stringify(g));
    } catch (e) {}
  };

  const k = createKickoff(a);
  const { allQs, qOn, filled, optVal, optLabel, esc, field, brief, sendToHubSpot } = k;
  const briefQs = allQs.filter((q) => q.step.id !== "send");
  const byId = Object.fromEntries(allQs.map((q) => [q.id, q]));
  DISCOVERY.forEach((d) => { byId[d.id] = byId[d.id] ? { ...byId[d.id], label: d.label } : d; });

  // The brief's questions are written in Simonne's first person; the guide speaks as "we".
  const we = (s) => String(s || "")
    .replace(/\bI’m\b/g, "we’re").replace(/\bI’ll\b/g, "we’ll").replace(/\bmy services\b/g, "our services")
    .replace(/\b(Tell|with|from|about|give) me\b/g, "$1 us").replace(/\bI\b/g, "we")
    .replace(/(^|[.?!]\s+)we/g, (m, pre) => `${pre}We`);

  /* ---------- Turning answers into words ---------- */
  const labelFor = (q, v) => { const o = (q.opts || []).find((x) => optVal(x) === v); return o ? optLabel(o) : v; };
  function describe(q) {
    const v = a[q.id];
    const verdicts = (items) => [["love", "Love it"], ["open", "Open to it"], ["no", "Not us"]]
      .map(([key, l]) => { const names = items.filter((s) => (v || {})[s.id] === key).map((s) => s.name); return names.length ? `${l}: ${names.join(", ")}` : ""; })
      .filter(Boolean).join(". ");
    switch (q.t) {
      case "chips": return q.multi ? (v || []).map((x) => labelFor(q, x)).join(", ") : labelFor(q, v || "");
      case "styles": return verdicts(STYLES);
      case "fonts": return verdicts(FONTS);
      case "palettes": return verdicts(PALETTES);
      case "voice": { const vo = VOICES.find((x) => x.id === v); return vo ? vo.name : ""; }
      case "moods": return (v || []).map((id) => MOODS.find((m) => m.id === id).name).join(", ");
      case "scales": return SCALES.filter(([key]) => (v || {})[key]).map(([key, l, r]) => `${l} to ${r}: ${v[key]} of 5`).join(", ");
      case "refs": return (v || []).filter((r) => r.url.trim()).map((r) => `${r.url} (${r.v === "love" ? "love it" : "not for me"})`).join("; ");
    }
    return String(v || "");
  }

  /* ---------- Rendering ---------- */
  const inputEl = document.getElementById("chat-input");
  const statusEl = document.getElementById("chat-status");
  const reviewEl = document.getElementById("chat-review");
  const progressEl = document.getElementById("chat-progress");
  const topicsEl = document.getElementById("chat-topics");

  const bubble = (who, html) => `<div class="chat-msg chat-${who}"><div class="chat-bubble">${html}</div></div>`;
  const paragraphs = (text) => esc(text).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
  const typed = (q) => ["text", "email", "area"].includes(q.t);

  function widgetHtml(qid, i) {
    const q = byId[qid];
    const many = q.multi || ["styles", "fonts", "palettes", "moods", "scales", "refs"].includes(q.t);
    const hint = q.multi || ["styles", "fonts", "palettes", "moods"].includes(q.t) ? "Pick as many as you like, then press Send." : "";
    const canSkip = !q.req;
    const body = typed(q) ? "" : `${hint ? `<p class="k-help">${hint}</p>` : ""}${field(q)}`;
    const send = many ? `<button type="button" class="btn chat-widget-send" data-widget-send="${qid}">Send</button>` : "";
    const skip = canSkip ? `<button type="button" class="k-link" data-skip="${qid}">Skip this one</button>` : "";
    const back = g.mode === "brief" && prevQ(qid) ? `<button type="button" class="k-link" data-back="${qid}">Back</button>` : "";
    if (!body && !skip && !back) return "";
    return `<div class="chat-widget form-field${body ? "" : " is-slim"}" data-widget="${qid}" data-log="${i}">
      ${body}<div class="chat-widget-actions">${send}${skip}${back}</div></div>`;
  }

  const actionsHtml = (actions, i) => `<div class="chat-actions" data-log="${i}">${actions.map(([id, label], n) =>
    `<button type="button" class="${n === 0 ? "btn" : "btn-outline"}" data-action="${id}">${esc(label)}</button>`).join("")}</div>`;

  function render() {
    logEl.innerHTML = g.log.map((item, i) => {
      if (item.who === "me") return bubble("me", paragraphs(item.text));
      let out = bubble("bot", item.html);
      if (item.open && item.ask && byId[item.ask]) out += widgetHtml(item.ask, i);
      if (item.open && item.actions) out += actionsHtml(item.actions, i);
      return out;
    }).join("");
    reviewEl.hidden = g.mode !== "review";
    if (!reviewEl.hidden) renderReview();
    renderProgress();
    topicsEl.innerHTML = TOPICS.filter((t) => !t.hidden).map((t) => `<button type="button" class="k-chip" data-topic="${t.id}">${esc(t.label)}</button>`).join("");
    logEl.scrollTop = logEl.scrollHeight;
    const ask = g.cur && byId[g.cur];
    inputEl.placeholder = ask && typed(ask) ? "Type your answer" : "Ask a question about our services";
  }

  function renderProgress() {
    if (g.mode !== "brief" || !g.cur || !byId[g.cur] || !byId[g.cur].step) { progressEl.hidden = true; return; }
    const steps = k.visibleSteps().filter((s) => s.id !== "send");
    const at = steps.findIndex((s) => s.id === byId[g.cur].step.id);
    progressEl.hidden = false;
    progressEl.innerHTML = `<span>Kickoff Brief · Step ${at + 1} of ${steps.length}: ${esc(byId[g.cur].step.title)}</span>
      <a href="/kickoff">Switch to the form</a>`;
  }

  function renderReview() {
    const missing = allQs.filter((q) => q.need && qOn(q) && !filled(q));
    const contactOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((a.email || "").trim()) && (a.biz_name || "").trim();
    document.getElementById("chat-brief").textContent = brief({ via: "guide" });
    document.getElementById("chat-missing").innerHTML = !contactOk
      ? "<strong>Before sending:</strong> we still need your email and business name."
      : missing.length ? `<strong>Still open:</strong> ${missing.map((q) => esc(q.b || q.label)).join(", ")}. You can send now, and we’ll cover these on the kickoff call.` : "<strong>Everything we need is here.</strong>";
    document.getElementById("chat-submit").disabled = !contactOk;
  }

  /* ---------- Saying things ---------- */
  const closeAll = () => g.log.forEach((item) => { item.open = false; });
  const say = (html, extra = {}) => g.log.push({ who: "bot", html, open: true, ...extra });
  const me = (text) => { closeAll(); g.log.push({ who: "me", text }); };

  function ask(qid) {
    const q = byId[qid];
    const prev = g.cur && byId[g.cur];
    g.cur = qid;
    if (g.mode === "brief" && q.step && (!prev || !prev.step || prev.step.id !== q.step.id) && q.step.intro) {
      say(`<p><strong>${esc(q.step.title)}.</strong> ${esc(we(q.step.intro))}</p>`, { open: false });
    }
    // The guide's own questions are already written as "we"; only the brief's need converting.
    const voice = DISCOVERY.some((d) => d.id === qid) ? String : we;
    const help = q.help ? `<p class="chat-help">${esc(voice(q.help))}</p>` : "";
    say(`<p>${esc(voice(q.label))}${q.req ? " (needed)" : ""}</p>${help}`, { ask: qid });
  }

  // Between the suggestion and the brief, every reply keeps the two next steps in reach.
  const NEXT = [["brief", "Start the Kickoff Brief"], ["contact", "Talk with us first"]];
  const nextSteps = (actions) => (actions || g.mode === "open" ? { actions: actions || NEXT } : {});

  function showTopic(t) {
    say(t.html(), nextSteps(t.actions));
    resume();
  }

  // After an answer to a side question, put the current question (or the next step) back in front of them.
  function resume() {
    if (g.cur && byId[g.cur]) {
      const q = byId[g.cur];
      say(`<p>Back to where we were: ${esc(we(q.label))}</p>`, { ask: g.cur });
    }
  }

  /* ---------- Discovery ---------- */
  function nextDiscovery() {
    const next = DISCOVERY.find((d) => !filled(byId[d.id]) && !g.skipped.includes(d.id));
    if (next) return ask(next.id);
    g.cur = null;
    g.mode = "open";
    const { html, ready } = suggestion(a);
    say(html, { actions: ready ? NEXT : [...NEXT].reverse() });
  }

  // Each need adds to the brief's own answers, so the brief starts filled in.
  function applyNeeds() {
    const add = (key, vals) => { a[key] = [...new Set([...(a[key] || []), ...vals])]; };
    (a.disc_needs || []).forEach((v) => {
      const n = NEEDS.find((x) => x.v === v);
      if (n && n.services) add("path_services", n.services);
      if (n && n.seats) add("path_seats", n.seats);
    });
    if ((a.path_services || []).some((s) => s !== "Not sure yet")) a.path_services = a.path_services.filter((s) => s !== "Not sure yet");
  }

  /* ---------- Kickoff Brief ---------- */
  const idx = (qid) => briefQs.findIndex((q) => q.id === qid);
  function prevQ(qid) {
    for (let i = idx(qid) - 1; i >= 0; i--) if (qOn(briefQs[i])) return briefQs[i];
    return null;
  }
  function nextBrief(fromId) {
    const start = fromId && idx(fromId) >= 0 ? idx(fromId) + 1 : 0;
    const next = briefQs.slice(start).find((q) => qOn(q) && !filled(q) && !g.skipped.includes(q.id));
    if (next) return ask(next.id);
    g.cur = null;
    g.mode = "review";
    say("<p>That’s everything. Your Kickoff Brief is below. Read it over, and send it when you’re ready.</p>", { open: false });
  }
  function startBrief() {
    g.mode = "brief";
    g.skipped = [];
    say("<p>Great. We’ll go one question at a time. Anything you’ve already told us is filled in, and your answers save on this device as you go. Please don’t share passwords here.</p>", { open: false });
    nextBrief(null);
  }

  // A question was answered (or skipped): move on in whichever part we're in.
  function advance(qid) {
    if (qid === "disc_needs") applyNeeds();
    if (g.mode === "disc") return nextDiscovery();
    if (g.mode === "brief") return nextBrief(qid);
  }

  function answerTyped(text) {
    const q = byId[g.cur];
    if (q.t === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      me(text);
      say("<p>That doesn’t look like an email address. Could you check it?</p>", { ask: q.id });
      return;
    }
    a[q.id] = text;
    me(text);
    advance(q.id);
  }

  // A typed message during a choice question: match it to an option if we can.
  function matchOption(q, text) {
    const t = text.toLowerCase().trim();
    const opts = q.opts || [];
    const exact = opts.find((o) => optVal(o).toLowerCase() === t || optLabel(o).toLowerCase() === t);
    if (exact) return optVal(exact);
    // "website" picks "A new or better website", but only when exactly one option fits.
    const near = t.length >= 4 ? opts.filter((o) => optLabel(o).toLowerCase().includes(t)) : [];
    return near.length === 1 ? optVal(near[0]) : null;
  }

  function handleTyped(text) {
    statusEl.className = "form-status";
    statusEl.textContent = "";
    const q = g.cur && byId[g.cur];
    if (q && typed(q)) return answerTyped(text);
    if (q && q.t === "chips") {
      const v = matchOption(q, text);
      if (v) {
        a[q.id] = q.multi ? [...new Set([...(a[q.id] || []), v])] : v;
        me(text);
        return advance(q.id);
      }
    }
    me(text);
    if (/^\s*(hi|hello|hey|good (morning|afternoon|evening))\b/i.test(text)) {
      say("<p>Hi there. Pick a topic below, or ask about any of our services.</p>", nextSteps());
      return resume();
    }
    const topic = matchTopic(text);
    if (topic) return showTopic(topic);
    say(FALLBACK, nextSteps());
    resume();
  }

  function act(id) {
    closeAll();
    if (id === "brief") { me("Start the Kickoff Brief"); startBrief(); }
    else if (id === "contact") { save(); window.location.href = contactLink(a); return; }
    save();
    render();
  }

  /* ---------- Events ---------- */
  document.getElementById("chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    handleTyped(text.slice(0, 2000));
    save();
    render();
    inputEl.focus();
  });
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); document.getElementById("chat-form").requestSubmit(); }
  });

  topicsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-topic]");
    if (!b) return;
    const t = TOPICS.find((x) => x.id === b.dataset.topic);
    me(t.label);
    showTopic(t);
    save();
    render();
  });

  logEl.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.scale) a.brand_scales = { ...(a.brand_scales || {}), [t.dataset.scale]: +t.value };
    else if (t.dataset.ref && t.tagName === "INPUT") {
      const items = [...(a.vis_refs || [{ url: "", note: "", v: "love" }])];
      items[+t.dataset.ref] = { ...items[+t.dataset.ref], [t.dataset.k]: t.value };
      a.vis_refs = items;
    }
    save();
  });
  logEl.addEventListener("change", (e) => {
    const t = e.target;
    if (t.tagName === "SELECT" && t.dataset.ref) {
      const items = [...(a.vis_refs || [{ url: "", note: "", v: "love" }])];
      items[+t.dataset.ref] = { ...items[+t.dataset.ref], v: t.value };
      a.vis_refs = items;
      save();
    }
  });
  logEl.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const rerenderWidget = () => {
      const w = b.closest(".chat-widget");
      const box = document.createElement("div");
      box.innerHTML = widgetHtml(w.dataset.widget, w.dataset.log);
      w.replaceWith(box.firstElementChild);
    };
    const done = (q) => {
      const said = describe(q);
      me(said || "Nothing picked. Let’s skip this one.");
      if (!said) g.skipped.push(q.id);
      advance(q.id);
      save();
      render();
    };
    if (b.dataset.action) return act(b.dataset.action);
    if (b.dataset.chip) {
      const q = byId[b.dataset.chip], v = b.dataset.val;
      if (q.multi) {
        const cur = [...(a[q.id] || [])], i = cur.indexOf(v);
        i >= 0 ? cur.splice(i, 1) : cur.push(v);
        a[q.id] = cur;
        save();
        return rerenderWidget();
      }
      a[q.id] = v;
      return done(q);
    }
    if (b.dataset.voice) { a.brand_voice = b.dataset.voice; return done(byId.brand_voice); }
    if (b.dataset.card) {
      const sv = { ...(a[b.dataset.card] || {}) }, id = b.dataset.id, v = b.dataset.v;
      if (sv[id] === v) delete sv[id]; else sv[id] = v;
      a[b.dataset.card] = sv;
      save();
      return rerenderWidget();
    }
    if (b.dataset.mood) {
      const cur = [...(a.vis_colors || [])], i = cur.indexOf(b.dataset.mood);
      i >= 0 ? cur.splice(i, 1) : cur.push(b.dataset.mood);
      a.vis_colors = cur;
      save();
      return rerenderWidget();
    }
    if (b.hasAttribute("data-addref")) {
      a.vis_refs = [...(a.vis_refs || [{ url: "", note: "", v: "love" }]), { url: "", note: "", v: "love" }];
      save();
      return rerenderWidget();
    }
    if (b.dataset.delref != null) {
      const items = [...(a.vis_refs || [])];
      items.splice(+b.dataset.delref, 1);
      a.vis_refs = items;
      save();
      return rerenderWidget();
    }
    if (b.dataset.widgetSend) return done(byId[b.dataset.widgetSend]);
    if (b.dataset.skip) {
      const q = byId[b.dataset.skip];
      me("Skip this one");
      g.skipped.push(q.id);
      advance(q.id);
      save();
      return render();
    }
    if (b.dataset.back) {
      const p = prevQ(b.dataset.back);
      if (!p) return;
      me("Back");
      g.skipped = g.skipped.filter((id) => id !== p.id);
      ask(p.id);
      if (filled(p)) g.log[g.log.length - 1].html += `<p class="chat-help">Your answer so far: ${esc(describe(p))}</p>`;
      save();
      return render();
    }
  });

  document.getElementById("chat-keep").addEventListener("click", () => {
    // Back into the brief, starting from the first open question.
    closeAll();
    g.skipped = [];
    const open = briefQs.find((q) => qOn(q) && !filled(q));
    if (open) { g.mode = "brief"; ask(open.id); }
    else say("<p>Every question has an answer. To change one, <a href=\"/kickoff\">switch to the form</a>. Your answers come with you.</p>", { open: false });
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
      await sendToHubSpot({ via: "guide" });
      try { localStorage.removeItem(DRAFT_KEY); localStorage.removeItem(GUIDE_KEY); } catch (e) {}
      document.getElementById("chat-app").hidden = true;
      document.getElementById("kick-done").hidden = false;
    } catch (err) {
      reviewStatus.className = "form-status is-error";
      reviewStatus.textContent = "Something went wrong sending that. Your answers are still saved here. Try again, or email simonnemv@gmail.com.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Send my Kickoff Brief";
    }
  });

  document.getElementById("chat-restart").addEventListener("click", () => { document.getElementById("chat-restart-confirm").hidden = false; });
  document.getElementById("chat-restart-no").addEventListener("click", () => { document.getElementById("chat-restart-confirm").hidden = true; });
  document.getElementById("chat-restart-yes").addEventListener("click", () => {
    Object.keys(a).forEach((key) => delete a[key]);
    g = fresh();
    formStep = 0;
    document.getElementById("chat-restart-confirm").hidden = true;
    begin();
  });

  function begin() {
    say(GREETING, { open: false });
    nextDiscovery();
    save();
    render();
  }

  if (g.log.length) {
    // Coming back: reopen whatever was last asked.
    const last = g.log[g.log.length - 1];
    if (last && last.who === "bot") last.open = true;
    render();
  } else {
    begin();
  }
})();
