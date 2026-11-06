// Kickoff Brief form: one step at a time, sent to HubSpot. Questions and the brief live in kickoff-core.js.
import { DRAFT_KEY, HUBSPOT_FORM_GUID, createKickoff } from "./kickoff-core.js";

(() => {
  const root = document.getElementById("kick-form");
  if (!root) return;

  /* ---------- State ---------- */
  let a = {};
  let step = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (saved && saved.a) { a = saved.a; step = saved.step || 0; }
  } catch (e) {}
  const save = () => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ a, step })); } catch (e) {} };

  // Prefill from the Investment calculator, e.g. ?services=Website|Brand Foundation&manage=Quarterly Sprint
  const params = new URLSearchParams(window.location.search);
  const listParam = (k) => (params.get(k) || "").split("|").map((s) => s.trim()).filter(Boolean);
  if (params.get("services") && !(a.path_services || []).length) a.path_services = listParam("services");
  if (params.get("seats") && !(a.path_seats || []).length) a.path_seats = listParam("seats");
  ["tier", "manage", "brand"].forEach((k) => { if (params.get(k) && !a["path_" + k]) a["path_" + k] = params.get(k); });

  const { allQs, qOn, visibleSteps, filled, esc, field, sendToHubSpot } = createKickoff(a);

  /* ---------- Rendering ---------- */
  const question = (q) => {
    const tag = q.req ? '<span class="required-tag">*</span>' : q.need ? '<span class="k-need">Helps most</span>' : q.optional ? '<span class="optional-tag">(optional)</span>' : "";
    const forAttr = ["text", "email", "area"].includes(q.t) ? ` for="k-${q.id}"` : "";
    return `<div class="form-field k-q${q.half ? " k-half" : ""}" id="k-wrap-${q.id}">
      <label id="k-l-${q.id}"${forAttr}>${esc(q.label)} ${tag}</label>
      ${q.help ? `<p class="k-help">${esc(q.help)}</p>` : ""}
      ${field(q)}</div>`;
  };

  const reviewStep = () => {
    const missing = allQs.filter((q) => q.need && qOn(q) && !filled(q));
    const steps = visibleSteps().filter((s) => s.id !== "send");
    return `<div class="k-summary">${steps.map((s) => {
      const qs = s.qs.filter(qOn), done = qs.filter(filled).length;
      return `<div class="k-sum-row"><span>${s.title}</span><span class="k-sum-n">${done} of ${qs.length} answered</span><button type="button" class="k-link" data-goto="${s.id}">Edit</button></div>`;
    }).join("")}</div>
    ${missing.length ? `<div class="k-missing"><strong>A few answers would help me most:</strong><ul>${missing.map((q) =>
      `<li><button type="button" class="k-link" data-goto="${q.step.id}">${esc(q.b || q.label)}</button></li>`).join("")}</ul>
      <p>You can still send it now, and we’ll cover these on our kickoff call.</p></div>` : `<div class="k-missing is-clear"><strong>Everything I need is here.</strong></div>`}
    <label class="checkbox-row k-consent"><input type="checkbox" id="k-consent"> I agree that Simonne Piriz Studio can store these answers to plan my project, as described in the <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</label>`;
  };

  const stepEl = document.getElementById("kick-step");
  const backBtn = document.getElementById("kick-back");
  const nextBtn = document.getElementById("kick-next");
  const statusEl = document.getElementById("kick-status");

  function render(focusTop) {
    const steps = visibleSteps();
    if (step >= steps.length) step = steps.length - 1;
    const s = steps[step];
    const qs = s.qs.filter(qOn);
    stepEl.innerHTML = `<div class="k-step-head"><div class="eyebrow">${s.id === "send" ? "Last step" : `Step ${step + 1} of ${steps.length}`}</div>
      <h2 class="heading" tabindex="-1" id="k-step-title">${s.title}</h2>${s.intro ? `<p>${s.intro}</p>` : ""}</div>
      ${s.id === "send" ? reviewStep() : `<div class="k-qs">${qs.map(question).join("")}</div>`}`;
    document.getElementById("kick-fill").style.width = `${((step + 1) / steps.length) * 100}%`;
    document.getElementById("kick-step-label").textContent = `${s.title} · ${step + 1} of ${steps.length}`;
    backBtn.hidden = step === 0;
    nextBtn.textContent = s.id === "send" ? "Send my Kickoff Brief" : steps[step + 1] && steps[step + 1].id === "send" ? "Review answers" : "Next";
    statusEl.className = "form-status";
    statusEl.textContent = "";
    updateCount();
    save();
    if (focusTop) {
      root.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("k-step-title").focus({ preventScroll: true });
    }
  }

  function updateCount() {
    const c = document.getElementById("k-count-web_pages");
    if (!c) return;
    const n = (a.web_pages || []).length, extra = Math.max(0, n - 5);
    c.textContent = n ? `${n} selected${extra ? ` · ${extra} beyond the Standard 5, at $250 each` : " · within the Standard build"}` : "";
  }

  function go(to) { step = to; render(true); }

  async function submit() {
    if (document.getElementById("kick-hp").value) return; // bot
    if (!document.getElementById("k-consent").checked) {
      statusEl.className = "form-status is-error";
      statusEl.textContent = "Please check the box to agree before sending.";
      return;
    }
    if (!HUBSPOT_FORM_GUID) {
      statusEl.className = "form-status is-error";
      statusEl.textContent = "This form isn\u2019t connected yet. Please email simonnemv@gmail.com and I\u2019ll send you a link that works.";
      return;
    }
    nextBtn.disabled = true;
    nextBtn.textContent = "Sending...";
    try {
      await sendToHubSpot({ via: "form" });
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      root.hidden = true;
      document.querySelector(".kick-progress").hidden = true;
      document.getElementById("kick-done").hidden = false;
      document.getElementById("kick-done").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      statusEl.className = "form-status is-error";
      statusEl.textContent = "Something went wrong sending that. Your answers are still saved here. Try again, or email simonnemv@gmail.com.";
      nextBtn.disabled = false;
      nextBtn.textContent = "Send my Kickoff Brief";
    }
  }

  /* ---------- Events ---------- */
  const set = (id, v) => { a[id] = v; save(); };
  const pathChanged = (id) => id.startsWith("path_") || id === "rv_channel";

  root.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.q) set(t.dataset.q, t.value);
    else if (t.dataset.scale) set("brand_scales", { ...(a.brand_scales || {}), [t.dataset.scale]: +t.value });
    else if (t.dataset.ref && t.tagName === "INPUT") {
      const list = [...(a.vis_refs || [{ url: "", note: "", v: "love" }])];
      list[+t.dataset.ref] = { ...list[+t.dataset.ref], [t.dataset.k]: t.value };
      set("vis_refs", list);
    }
  });
  root.addEventListener("change", (e) => {
    const t = e.target;
    if (t.tagName === "SELECT" && t.dataset.ref) {
      const list = [...(a.vis_refs || [{ url: "", note: "", v: "love" }])];
      list[+t.dataset.ref] = { ...list[+t.dataset.ref], v: t.value };
      set("vis_refs", list);
    }
  });
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.chip) {
      const q = allQs.find((x) => x.id === b.dataset.chip), v = b.dataset.val;
      if (q.multi) {
        const cur = [...(a[q.id] || [])], i = cur.indexOf(v);
        i >= 0 ? cur.splice(i, 1) : cur.push(v);
        b.setAttribute("aria-pressed", i < 0);
        set(q.id, cur);
      } else {
        const on = a[q.id] !== v;
        b.parentElement.querySelectorAll(".k-chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", on);
        set(q.id, on ? v : "");
      }
      if (pathChanged(q.id)) render(false);
      else updateCount();
    } else if (b.dataset.voice) {
      const on = a.brand_voice !== b.dataset.voice;
      b.parentElement.querySelectorAll(".k-voice").forEach((c) => c.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", on);
      set("brand_voice", on ? b.dataset.voice : "");
    } else if (b.dataset.card) {
      const sv = { ...(a[b.dataset.card] || {}) }, id = b.dataset.id, v = b.dataset.v;
      if (sv[id] === v) delete sv[id]; else sv[id] = v;
      const card = b.closest(".k-card");
      card.className = "k-card" + (sv[id] ? " is-" + sv[id] : "");
      card.querySelectorAll(".k-verdict button").forEach((x) => x.setAttribute("aria-pressed", sv[id] === x.dataset.v));
      set(b.dataset.card, sv);
    } else if (b.dataset.mood) {
      const cur = [...(a.vis_colors || [])], i = cur.indexOf(b.dataset.mood);
      i >= 0 ? cur.splice(i, 1) : cur.push(b.dataset.mood);
      b.setAttribute("aria-pressed", i < 0);
      set("vis_colors", cur);
    } else if (b.hasAttribute("data-addref")) {
      set("vis_refs", [...(a.vis_refs || [{ url: "", note: "", v: "love" }]), { url: "", note: "", v: "love" }]);
      render(false);
      document.getElementById(`k-ref-url-${a.vis_refs.length - 1}`).focus();
    } else if (b.dataset.delref != null) {
      const list = [...(a.vis_refs || [])];
      list.splice(+b.dataset.delref, 1);
      set("vis_refs", list);
      render(false);
    } else if (b.dataset.goto) {
      go(visibleSteps().findIndex((s) => s.id === b.dataset.goto));
    }
  });

  backBtn.addEventListener("click", () => go(Math.max(0, step - 1)));
  nextBtn.addEventListener("click", () => {
    const steps = visibleSteps();
    if (steps[step].id === "send") return submit();
    if (steps[step].id === "start") {
      const email = (a.email || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !(a.biz_name || "").trim()) {
        statusEl.className = "form-status is-error";
        statusEl.textContent = "Please add your email and business name so I can match your answers to you.";
        return;
      }
    }
    go(step + 1);
  });

  render(false);
})();
