const header = document.querySelector(".site-header");
if (header) {
  const toggleHeaderShadow = () => header.classList.toggle("scrolled", window.scrollY > 8);
  toggleHeaderShadow();
  window.addEventListener("scroll", toggleHeaderShadow, { passive: true });
}

const inquiryForm = document.getElementById("inquiry-form");
if (inquiryForm) {
  const HUBSPOT_PORTAL_ID = "247415032";
  const HUBSPOT_FORM_GUID = "aaf4361b-1fa4-46fd-ae8f-df87d05dfd4a";
  const HUBSPOT_ENDPOINT = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`;
  const SERVICES_FIELD_NAME = "0-1/strong_which_service_s__are_you_interested_in___strong_";

  const submitBtn = document.getElementById("inquiry-submit");
  const statusEl = document.getElementById("inquiry-status");

  const params = new URLSearchParams(window.location.search);
  const prefillNeed = params.get("need");
  const prefillServices = params.get("services");

  if (prefillNeed) {
    document.getElementById("need").value = prefillNeed;
  }
  if (prefillServices) {
    prefillServices.split("|").forEach((label) => {
      const checkbox = inquiryForm.querySelector(`input[name="services"][value="${CSS.escape(label)}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }
  if (prefillNeed || prefillServices) {
    const note = document.getElementById("prefill-note");
    if (note) note.hidden = false;
  }

  inquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusEl.className = "form-status";
    statusEl.textContent = "";

    const fields = [];
    const formData = new FormData(inquiryForm);
    const selectedServices = formData.getAll("services");

    for (const el of inquiryForm.elements) {
      if (!el.name || el.name === "services" || el.disabled) continue;
      if ((el.type === "checkbox" || el.type === "radio") && !el.checked) continue;
      if (el.value === "") continue;
      fields.push({ name: el.name, value: el.value });
    }

    if (selectedServices.length) {
      fields.push({ name: SERVICES_FIELD_NAME, value: selectedServices.join(";") });
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
      const response = await fetch(HUBSPOT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields,
          context: {
            pageUri: window.location.href,
            pageName: document.title,
          },
        }),
      });

      if (!response.ok) throw new Error("Submission failed");

      inquiryForm.reset();
      statusEl.className = "form-status is-success";
      statusEl.textContent = "Thanks — that's sent. I'll be in touch soon.";
    } catch (err) {
      statusEl.className = "form-status is-error";
      statusEl.textContent = "Something went wrong sending that. Try again, or email simonnemv@gmail.com directly.";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send It Over";
    }
  });
}

const calcRoot = document.getElementById("investment-calc");
if (calcRoot) {
  const RATES = {
    website: { setup: { standard: 2900, premium: 5200 }, handoff: { standard: 3800, premium: 6800 }, monthly: 400, quarterly: 750 },
    content: { setup: 450, monthly: 800, quarterly: 1500 },
    social: { setup: 350, monthly: 750, quarterly: 1350 },
  };

  const fmt = (n) => `$${Math.round(n).toLocaleString()}`;

  const qtyInput = document.getElementById("addon-posts");
  calcRoot.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = parseInt(btn.dataset.step, 10);
      const next = Math.min(20, Math.max(0, parseInt(qtyInput.value, 10) + step));
      qtyInput.value = next;
      recalc();
    });
  });

  calcRoot.querySelectorAll(".calc-include").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const service = checkbox.closest(".calc-service");
      service.querySelector(".calc-options").hidden = !checkbox.checked;
      recalc();
    });
  });

  calcRoot.querySelectorAll('input[type="radio"], .calc-addon[type="checkbox"]').forEach((el) => {
    el.addEventListener("change", recalc);
  });

  function recalc() {
    const included = {
      website: calcRoot.querySelector('.calc-include[data-service="website"]').checked,
      content: calcRoot.querySelector('.calc-include[data-service="content"]').checked,
      social: calcRoot.querySelector('.calc-include[data-service="social"]').checked,
    };

    const TIER_LABEL = { standard: "Standard", premium: "Premium" };
    const PATH_LABEL = { monthly: "Monthly Retainer", quarterly: "Quarterly Sprint", handoff: "Build & Handoff" };
    const SERVICE_LABEL = {
      website: "Website Design & Management",
      content: "Content & Blog Management",
      social: "Social Media Management",
    };

    let n = 0;
    let setupSum = 0;
    let handoffSum = 0;
    let monthlySum = 0;
    let quarterlySum = 0;
    const selectedLabels = [];
    const summaryParts = [];

    if (included.website) {
      n++;
      selectedLabels.push(SERVICE_LABEL.website);
      const tier = calcRoot.querySelector('input[name="website-tier"]:checked').value;
      const path = calcRoot.querySelector('input[name="website-path"]:checked').value;
      summaryParts.push(`${SERVICE_LABEL.website} (${TIER_LABEL[tier]}, ${PATH_LABEL[path]})`);
      if (path === "handoff") {
        handoffSum += RATES.website.handoff[tier];
      } else {
        setupSum += RATES.website.setup[tier];
        if (path === "monthly") monthlySum += RATES.website.monthly;
        if (path === "quarterly") quarterlySum += RATES.website.quarterly;
      }
    }

    if (included.content) {
      n++;
      selectedLabels.push(SERVICE_LABEL.content);
      setupSum += RATES.content.setup;
      const path = calcRoot.querySelector('input[name="content-path"]:checked').value;
      summaryParts.push(`${SERVICE_LABEL.content} (${PATH_LABEL[path]})`);
      if (path === "monthly") monthlySum += RATES.content.monthly;
      if (path === "quarterly") quarterlySum += RATES.content.quarterly;
    }

    if (included.social) {
      n++;
      selectedLabels.push(SERVICE_LABEL.social);
      setupSum += RATES.social.setup;
      const path = calcRoot.querySelector('input[name="social-path"]:checked').value;
      summaryParts.push(`${SERVICE_LABEL.social} (${PATH_LABEL[path]})`);
      if (path === "monthly") monthlySum += RATES.social.monthly;
      if (path === "quarterly") quarterlySum += RATES.social.quarterly;
    }

    const oneTimeDiscount = n >= 2 ? 0.1 : 0;
    const recurringDiscount = n >= 3 ? 0.15 : n === 2 ? 0.1 : 0;

    let oneTime = (setupSum + handoffSum) * (1 - oneTimeDiscount);
    let monthly = monthlySum * (1 - recurringDiscount);
    let quarterly = quarterlySum * (1 - recurringDiscount);

    const addonDescs = [];
    const extraPosts = parseInt(qtyInput.value, 10) || 0;
    if (extraPosts > 0) {
      monthly += extraPosts * 175;
      addonDescs.push(`${extraPosts} extra blog post${extraPosts > 1 ? "s" : ""}/month`);
    }
    if (calcRoot.querySelector('[data-addon="extraPlatform"]').checked) {
      monthly += 200;
      addonDescs.push("an additional social platform");
    }
    if (calcRoot.querySelector('[data-addon="newsletter"]').checked) {
      monthly += 300;
      addonDescs.push("email newsletter management");
    }
    if (calcRoot.querySelector('[data-addon="rushSetup"]').checked) {
      oneTime += oneTime * 0.2;
      addonDescs.push("rush setup");
    }
    if (calcRoot.querySelector('[data-addon="brandVoiceDoc"]').checked) {
      oneTime += 300;
      addonDescs.push("a brand voice / copy deep-dive document");
    }

    const emptyEl = document.getElementById("calc-empty");
    const linesEl = document.getElementById("calc-lines");
    const hasSelection = n > 0;

    emptyEl.hidden = hasSelection;
    linesEl.hidden = !hasSelection;

    document.getElementById("calc-line-onetime").hidden = oneTime <= 0;
    document.getElementById("calc-line-monthly").hidden = monthly <= 0;
    document.getElementById("calc-line-quarterly").hidden = quarterly <= 0;

    document.getElementById("calc-onetime").textContent = fmt(oneTime);
    document.getElementById("calc-monthly").textContent = `${fmt(monthly)}/mo`;
    document.getElementById("calc-quarterly").textContent = `${fmt(quarterly)}/quarter`;

    const noteEl = document.getElementById("calc-discount-note");
    let discountNoteText = "";
    if (n >= 2) {
      discountNoteText = `includes a ${Math.round(recurringDiscount * 100)}% bundle discount for combining ${n} services`;
      noteEl.hidden = false;
      noteEl.textContent = `Includes a ${Math.round(recurringDiscount * 100)}% bundle discount for combining ${n} services.`;
    } else {
      noteEl.hidden = true;
    }

    const ctaLink = document.getElementById("calc-cta");
    if (n === 0) {
      ctaLink.href = "/contact";
    } else {
      const investmentParts = [];
      if (oneTime > 0) investmentParts.push(`${fmt(oneTime)} one-time`);
      if (monthly > 0) investmentParts.push(`${fmt(monthly)}/mo`);
      if (quarterly > 0) investmentParts.push(`${fmt(quarterly)}/quarter`);

      let need = `From the Investment calculator, I'm interested in: ${summaryParts.join("; ")}. Estimated investment: ${investmentParts.join(" + ")}`;
      need += discountNoteText ? ` (${discountNoteText}).` : ".";
      if (addonDescs.length) need += ` Add-ons: ${addonDescs.join(", ")}.`;

      const params = new URLSearchParams();
      params.set("need", need);
      params.set("services", selectedLabels.join("|"));
      ctaLink.href = `/contact?${params.toString()}`;
    }
  }

  recalc();
}

const revealTargets = document.querySelectorAll(".reveal");
if (revealTargets.length && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("is-visible"));
}
