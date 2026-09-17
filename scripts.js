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
