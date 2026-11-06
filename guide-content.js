// Studio guide: everything it can say. It never writes anything new; every reply comes from this file.
// Keep it to what's on the site: our services, our prices (from pricing.js), our process and Simonne's background.
// Writing rules: "we" for the studio, Simonne named where her review matters, no em dashes, no outside links,
// no other companies, no logo design.

const { RATES, FULL_TEAM_PRICE, SEATS, EXTRAS, BUNDLE } = window.SP_PRICING;
const $ = (n) => `$${Math.round(n).toLocaleString()}`;
const pct = (n) => `${Math.round(n * 100)}%`;
const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

export const GREETING = `<p>Hi, this is the Simonne Piriz Studio guide. It's automated, and it only answers from this website.</p>
<p>We can help you figure out what you need, answer questions about our services, and walk you through your Kickoff Brief.</p>`;

export const FALLBACK = `<p>We can only answer questions about Simonne Piriz Studio and what's on this site. Pick a topic below, or <a href="/contact">contact us directly</a>.</p>`;

/* ---------- Topics: the buttons under the chat, and what typed questions are matched to ---------- */
export const TOPICS = [
  { id: "offer", label: "What's offered",
    match: /\b(offer|services?|provide|what (do|can) you|what is this|help with|do you do)\b/,
    html: () => `<p>We run three core services: Website Design &amp; Management, Content &amp; Blog Management, and Social Media Management. Each one is a seat on your marketing team.</p>
<p>A team of AI agents drafts the work, Simonne reviews it, and you approve it before anything goes live. Take one service or all three. Starting from scratch? Brand documents, a new website, social pages and CRM setup can be built first.</p>` },
  { id: "how", label: "How it works",
    match: /\b(how (does|do|will) (it|this|you|the)|process|review\w*|approv\w*|agents?|ai|human|person|who (does|writes|checks|reviews))\b/,
    html: () => `<p>Your team of agents plans and drafts your site updates, blog posts and social posts, built around your business and your industry.</p>
<p>Every draft is reviewed by Simonne, our Marketing Director, for accuracy, brand voice and strategy before you see it. You approve it, and then it publishes on schedule. Nothing goes live without your approval.</p>` },
  { id: "ways", label: "Ways to work together",
    match: /\b(retainer|monthly|quarter\w*|sprint|hand ?off|handover|hand (it )?over|own it|ownership|ways? to work|engagement|contract)\b/,
    html: () => `<p>There are two ways to work with us.</p>
${list([
  "<strong>We run it.</strong> Your agents work every month under our direction, on a Monthly Retainer.",
  "<strong>We build it, you run it.</strong> We build your agents, set them up in your own accounts, and hand you a playbook and a walkthrough (Build &amp; Handoff).",
])}
<p>A Quarterly Sprint is a focused session each quarter, and an Update Pack covers 3 small site changes. You own it either way.</p>` },
  { id: "cost", label: "What it costs",
    match: /\b(cost|costs|price|prices|pricing|how much|budget|rates?|fees?|invest\w*|afford|quote|expensive|cheap)\b|\$/,
    html: () => `<p>Monthly Retainer, plus a one-time setup:</p>
${list([
  `Website: ${$(RATES.website.monthly)}/mo, setup ${$(RATES.website.setup.standard)} (Standard) or ${$(RATES.website.setup.premium)} (Premium)`,
  `Content &amp; Blog: ${$(RATES.content.monthly)}/mo, setup ${$(RATES.content.setup)}`,
  `Social Media: ${$(RATES.social.monthly)}/mo, setup ${$(RATES.social.setup)}`,
])}
<p>Build &amp; Handoff, one-time: Website ${$(RATES.website.handoff.standard)} (Standard) or ${$(RATES.website.handoff.premium)} (Premium), Content ${$(RATES.content.handoff)}, Social ${$(RATES.social.handoff)}.</p>
<p>Combining two services takes ${pct(BUNDLE.two)} off, and three takes ${pct(BUNDLE.three)}. The Full Marketing Team (website, content, social, CRM, reporting and the email newsletter, all monthly) is a flat ${$(FULL_TEAM_PRICE)}/mo.</p>
<p>The <a href="/services#investment-calc">Investment calculator</a> shows your exact total. These are estimates for planning, and final fees go in a signed agreement.</p>` },
  { id: "scratch", label: "Starting from scratch",
    match: /\b(scratch|brand foundation|brand documents?|new (website|site|business)|no (website|site|brand)|just starting|starting out|startup|crm setup|social pages)\b/,
    html: () => list([
      `<strong>Brand Foundation</strong>, ${$(EXTRAS.brandFoundation)} one-time: positioning and messaging, voice and tone, color, type and theme. It works with your existing logo.`,
      `<strong>New Website</strong>: the standard build covers up to 5 pages, and extra pages are ${$(EXTRAS.extraPage)} each. It connects to your CRM and analytics.`,
      `<strong>Social Pages</strong>, ${$(EXTRAS.socialPages)} one-time: up to 3 new profiles set up and ready to post.`,
      `<strong>CRM Setup</strong>, ${$(SEATS.crm.setup)} setup: contacts, a pipeline and a website form, built on HubSpot, and it can start on free tools.`,
    ]) },
  { id: "seats", label: "Extra team seats",
    match: /\b(seats?|analyst|designer|graphics|crm|automation|reporting|reports?|retention|training|docs|newsletter)\b/,
    html: () => `${list(Object.values(SEATS).map((s) => `${s.label}: ${[s.monthly && `${$(s.monthly)}/mo`, s.setup && `${$(s.setup)} ${s.monthly ? "setup" : "one-time"}`].filter(Boolean).join(" plus ")}`))}
<p>Every seat is AI-assisted and reviewed before anything reaches you.</p>` },
  { id: "about", label: "About Simonne",
    match: /\b(simonne|piriz|founder|owner|who are you|who runs|who is|about (you|her|the studio)|experience|background|qualifications?)\b/,
    html: () => `<p>Simonne Piriz is a Marketing Technology and Operations Executive with over a decade of experience in healthcare and SaaS. She has built marketing technology stacks from the ground up, managed HubSpot and Salesforce integrations for health tech platforms, and built marketing functions from zero.</p>
<p>Today she pairs that experience with AI and stays accountable for the strategy, the quality and every result. <a href="/about">More about Simonne</a>.</p>` },
  { id: "start", label: "Get started",
    match: /\b(get started|start|begin|kick ?off|brief|sign up|hire|book|contact|talk|call|consult\w*|next step)\b/,
    html: () => `<p>The best first step is the Kickoff Brief, which we can do right here, one question at a time. If you'd rather talk first, you can reach us through the <a href="/contact">contact page</a>.</p>`,
    actions: [["brief", "Start the Kickoff Brief"], ["contact", "Talk with us first"]] },
  // Answered when asked, but not shown as a button.
  { id: "logo", label: "Logo design", hidden: 1,
    match: /\b(logos?)\b/,
    html: () => `<p>Logo design isn't one of our services. Brand Foundation works with your existing logo, and if you don't have one yet, a clean wordmark (your business name set in your brand font) works well for launch.</p>` },
];

// Picks the topic a typed question is about, or null. The most specific matching topic wins.
export function matchTopic(text) {
  const t = ` ${text.toLowerCase()} `;
  const hits = TOPICS.filter((x) => x.match.test(t));
  if (!hits.length) return null;
  // "How much does the website cost" matches both offer-ish words and cost; prefer the narrower topics.
  const order = ["logo", "cost", "about", "scratch", "seats", "ways", "how", "start", "offer"];
  return hits.sort((x, y) => order.indexOf(x.id) - order.indexOf(y.id))[0];
}

/* ---------- Discovery: a few questions before the brief ---------- */
// Each need adds to the brief's own answers (path_services / path_seats), so the brief starts filled in.
export const NEEDS = [
  { v: "A new or better website", services: ["Website"] },
  { v: "Regular blog content", services: ["Content & Blog"] },
  { v: "Consistent social media", services: ["Social Media"] },
  { v: "Brand basics: voice, colors and fonts", services: ["Brand Foundation"] },
  { v: "New social profiles set up", services: ["New social pages"] },
  { v: "Leads and follow-ups in one place", seats: ["CRM & Automation"] },
  { v: "Knowing what's working", seats: ["Reporting"] },
  { v: "Bringing back customers who've gone quiet", seats: ["Customer Retention"] },
  { v: "All of it: a whole marketing team", services: ["Full Marketing Team"] },
  { v: "Not sure yet", services: ["Not sure yet"] },
];

// The guide's own questions. path_brand and path_manage are asked here too, straight from the brief.
export const DISCOVERY = [
  { id: "disc_needs", t: "chips", multi: 1, b: "What they want help with",
    label: "What would you like help with? Pick everything that fits.", opts: NEEDS.map((n) => n.v) },
  { id: "path_brand", label: "Where does your brand stand today?" },
  { id: "path_manage", label: "Once everything is set up, how would you like to work together?" },
  { id: "disc_problem", t: "area", optional: 1, b: "In their words",
    label: "In your own words, what's the biggest thing you're hoping to solve?",
    help: "For example: “I don't have time to post,” or “my site doesn't bring in calls.” Type it below, or skip." },
];

/* ---------- The suggestion after discovery ---------- */
const serviceLine = (key, name, manage) => {
  const r = RATES[key];
  const setup = typeof r.setup === "object" ? `${$(r.setup.standard)} (Standard) or ${$(r.setup.premium)} (Premium)` : $(r.setup);
  const handoff = typeof r.handoff === "object" ? `${$(r.handoff.standard)} (Standard) or ${$(r.handoff.premium)} (Premium)` : $(r.handoff);
  if (manage === "Build & Handoff") return `<strong>${name}</strong>: ${handoff}, one-time, then it's yours to run`;
  if (manage === "Quarterly Sprint") return `<strong>${name}</strong>: ${$(r.quarterly)}/quarter, plus ${setup} setup`;
  return `<strong>${name}</strong>: ${$(r.monthly)}/mo, plus ${setup} setup`;
};

// Returns { html, ready }. ready means there's enough to start the brief; otherwise we suggest talking first.
export function suggestion(a) {
  const services = a.path_services || [];
  const seats = a.path_seats || [];
  const manage = a.path_manage || "";
  const has = (v) => services.includes(v);
  const lines = [];

  if (has("Full Marketing Team")) {
    lines.push(`<strong>Full Marketing Team</strong>: website, content, social, CRM, reporting and the email newsletter, all run monthly, for a flat ${$(FULL_TEAM_PRICE)}/mo plus setup`);
  } else {
    if (has("Website")) lines.push(serviceLine("website", "Website Design &amp; Management", manage));
    if (has("Content & Blog")) lines.push(serviceLine("content", "Content &amp; Blog Management", manage));
    if (has("Social Media")) lines.push(serviceLine("social", "Social Media Management", manage));
  }
  const noBrand = a.path_brand === "No brand yet" || a.path_brand === "Logo only";
  if (has("Brand Foundation") || noBrand) {
    lines.push(`<strong>Brand Foundation</strong>, ${$(EXTRAS.brandFoundation)} one-time${has("Brand Foundation") ? "" : ", since your brand is still taking shape"}. It becomes the instruction manual your agents work from.`);
  }
  if (has("New social pages")) lines.push(`<strong>Social Pages</strong>, ${$(EXTRAS.socialPages)} one-time: up to 3 new profiles, ready to post`);
  const seatKey = { "CRM & Automation": "crm", Reporting: "reporting", "Customer Retention": "retention" };
  const included = has("Full Marketing Team") ? ["CRM & Automation", "Reporting"] : [];
  seats.filter((s) => seatKey[s] && !included.includes(s)).forEach((s) => {
    const seat = SEATS[seatKey[s]];
    lines.push(`<strong>${seat.label}</strong>: ${$(seat.monthly)}/mo${seat.setup ? ` plus ${$(seat.setup)} setup` : ""}`);
  });

  const core = ["Website", "Content & Blog", "Social Media"].filter(has).length;
  const notes = [];
  if (!has("Full Marketing Team") && core >= 2 && manage !== "Build & Handoff") {
    notes.push(`Combining ${core} services takes ${pct(core >= 3 ? BUNDLE.three : BUNDLE.two)} off the ongoing price.`);
  }
  if (manage === "Not sure yet" || !manage) notes.push("Prices above are for a Monthly Retainer. We can talk through the other ways to work together.");
  notes.push(`These are estimates for planning. The <a href="/services#investment-calc">Investment calculator</a> shows an exact total, and final fees go in a signed agreement.`);

  const picked = services.some((s) => s !== "Not sure yet") || seats.length > 0;
  const ready = picked && !!manage && manage !== "Not sure yet";
  let html;
  if (!lines.length) {
    html = `<p>That's completely fine. A short conversation is usually the best place to start, and we can figure it out together.</p>`;
  } else {
    html = `<p>Here's a starting point, based on what you've told us:</p>${list(lines)}<p>${notes.join(" ")}</p>`;
  }
  html += ready
    ? `<p>The next step is your Kickoff Brief. We can do it right here, one question at a time, and what you've told us so far is already filled in.</p>`
    : `<p>Since a few things are still open, talking with us first is a good next step. You can also start the Kickoff Brief now, and we'll settle the rest on the kickoff call.</p>`;
  return { html, ready };
}

// Contact page link carrying only the service names they picked (nothing they typed).
export function contactLink(a) {
  const names = { Website: "Website Design & Management", "Content & Blog": "Content & Blog Management", "Social Media": "Social Media Management" };
  const services = a.path_services || [];
  const picked = services.includes("Full Marketing Team") ? Object.values(names) : services.map((s) => names[s]).filter(Boolean);
  const params = new URLSearchParams();
  if ((a.disc_needs || []).length) params.set("need", `From the studio guide, I'd like help with: ${a.disc_needs.join(", ")}.`);
  params.set("services", (picked.length ? picked : ["Not sure yet."]).join("|"));
  return `/contact?${params}`;
}
