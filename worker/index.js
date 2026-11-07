// Form automation. The contact inquiry and the Kickoff Brief post to /api/submit instead of
// straight to HubSpot. This passes the submission on to HubSpot, answers the visitor, and
// then, in the background:
//   1. finds or creates their HubSpot deal and adds a follow-up task to it,
//   2. sends them an auto-reply from Simonne's Gmail,
//   3. puts a follow-up on her Google Calendar,
//   4. posts a summary card to Slack (via Vinny), saying how steps 1-3 went.
// Each step runs only when its secrets are set (see worker/README.md), and a step that
// fails never affects the submission itself, which HubSpot has already accepted.
// Every other request is served from the static site.

const PORTAL_ID = "247415032";
const FORMS = {
  inquiry: { guid: "aaf4361b-1fa4-46fd-ae8f-df87d05dfd4a", label: "Contact inquiry" },
  kickoff: { guid: "a3e9a2de-1ff1-4b99-aefc-8aa841bc9caa", label: "Kickoff Brief" },
};

// HubSpot field names (after the "0-1/" object prefix) shown in Slack and the task, in order.
const LABELS = {
  email: "Email",
  phone: "Phone",
  name: "Company",
  company: "Company",
  website: "Website",
  kickoff_services: "Services",
  strong_which_service_s__are_you_interested_in___strong_: "Services",
  kickoff_brand_status: "Brand",
  kickoff_budget: "Budget",
  company_size: "Company size",
  timeline: "Timeline",
  industry: "Industry",
  strong_how_did_you_hear_about_us___strong__nbsp_: "Heard about me from",
  strong_what_do_you_need_help_with___strong_: "What they need",
};
const LONG_FIELDS = new Set(["strong_what_do_you_need_help_with___strong_"]);

const FOLLOW_UP_HOUR = 10;
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/submit") return env.ASSETS.fetch(request);
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ message: "Expected a JSON body." }, 400);
    }
    const form = FORMS[body?.form];
    if (!form || !Array.isArray(body.fields)) return json({ message: "Unknown form." }, 400);

    const fields = body.fields
      .filter((f) => f && typeof f.name === "string" && typeof f.value === "string")
      .map(({ name, value }) => ({ name, value }));
    const { pageUri, pageName, hutk } = body.context ?? {};
    const context = { pageUri, pageName, hutk, ipAddress: request.headers.get("CF-Connecting-IP") ?? undefined };

    const hs = await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${form.guid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields, context }),
    });
    if (!hs.ok) {
      const detail = await hs.text();
      console.error(`[form] HubSpot rejected the ${body.form} submission: ${hs.status} ${detail}`);
      return new Response(detail, { status: hs.status, headers: { "Content-Type": "application/json" } });
    }

    ctx.waitUntil(automate(toLead(body.form, form.label, fields, url.origin), env));
    return json({ ok: true });
  },
};

function json(data, status = 200) {
  return Response.json(data, { status });
}

/* ---------- The lead ---------- */

function toLead(formId, formLabel, fields, origin) {
  const by = Object.fromEntries(fields.map((f) => [f.name.split("/").pop(), f.value.trim()]));
  const oneLine = (s) => (s ?? "").replace(/[\r\n]+/g, " ").trim();
  const first = oneLine(by.firstname);
  const name = oneLine([by.firstname, by.lastname].filter(Boolean).join(" "));
  const email = oneLine(by.email);
  const details = Object.entries(LABELS)
    .filter(([key, label]) => by[key] && !(label === "Company" && key === "company" && by.name))
    .map(([key, label]) => ({ key, label, value: by[key] }));
  return {
    formId,
    formLabel,
    first,
    lastname: oneLine(by.lastname),
    name,
    email: EMAIL_RE.test(email) ? email : "",
    company: oneLine(by.name || by.company),
    details,
    brief: by.kickoff_brief || "",
    origin,
  };
}

const who = (lead) => [lead.name || lead.email || "Someone", lead.company && `(${lead.company})`].filter(Boolean).join(" ");

/* ---------- Fan-out ---------- */

async function automate(lead, env) {
  const slot = followUpSlot(env.FOLLOW_UP_TIMEZONE || "America/New_York");
  const results = {};
  const run = async (key, needs, step) => {
    if (needs.some((k) => !env[k])) return (results[key] = { skipped: true });
    try {
      results[key] = { ok: true, ...(await step()) };
    } catch (err) {
      console.error(`[form] ${key} failed: ${err.message}`);
      results[key] = { ok: false };
    }
  };

  const google = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"];
  await run("hubspot", ["HUBSPOT_TOKEN"], () => hubspotFollowUp(lead, env, slot));
  const token = google.every((k) => env[k]) ? googleToken(env) : null;
  if (token) token.catch(() => {}); // each step below reports its own failure
  await Promise.all([
    run("email", google, async () => (lead.email ? autoReply(lead, await token) : { skipped: true })),
    run("calendar", google, async () => calendarFollowUp(lead, env, slot, await token, results.hubspot)),
  ]);
  await run("slack", ["SLACK_BOT_TOKEN", "SLACK_CHANNEL"], () => slackAlert(lead, env, slot, results));
}

// Next weekday at FOLLOW_UP_HOUR in the given time zone.
function followUpSlot(timeZone) {
  const parts = (d) =>
    Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
        .formatToParts(d)
        .map((p) => [p.type, p.value]),
    );
  let day = new Date(Date.now() + 864e5);
  while (["Sat", "Sun"].includes(parts(day).weekday)) day = new Date(day.getTime() + 864e5);
  const p = parts(day);
  const date = `${p.year}-${p.month}-${p.day}`;
  const hh = String(FOLLOW_UP_HOUR).padStart(2, "0");
  const start = `${date}T${hh}:00:00`;

  // The instant that is `start` on the wall clock in `timeZone`.
  const guess = new Date(`${start}Z`);
  const g = parts(guess);
  const drift = Date.UTC(g.year, g.month - 1, g.day, g.hour, g.minute, g.second) - guess.getTime();
  const at = new Date(guess.getTime() - drift);

  const label = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(at);
  return { timeZone, start, end: `${date}T${hh}:30:00`, at, label };
}

/* ---------- HubSpot: deal + task ---------- */

async function hubspot(env, method, path, body) {
  const res = await fetch(`https://api.hubapi.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${env.HUBSPOT_TOKEN}`, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`hubspot ${method} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const assoc = (id, typeId) => ({ to: { id }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: typeId }] });
const DEAL_TO_CONTACT = 3;
const TASK_TO_CONTACT = 204;
const TASK_TO_DEAL = 216;

async function hubspotFollowUp(lead, env, slot) {
  if (!lead.email) throw new Error("no valid email to match a contact on");
  const owner = env.HUBSPOT_OWNER_ID ? { hubspot_owner_id: env.HUBSPOT_OWNER_ID } : {};
  const stage = (lead.formId === "kickoff" && env.HUBSPOT_KICKOFF_STAGE) || env.HUBSPOT_DEAL_STAGE || "appointmentscheduled";

  // The form submission creates the contact too; upserting on email means whichever lands
  // first creates it and the other updates it.
  const upsert = await hubspot(env, "POST", "/crm/v3/objects/contacts/batch/upsert", {
    inputs: [{ idProperty: "email", id: lead.email, properties: { email: lead.email, ...(lead.first && { firstname: lead.first }), ...(lead.lastname && { lastname: lead.lastname }) } }],
  });
  const contactId = upsert.results[0].id;

  // Reuse their newest open deal (an inquiry followed by a Kickoff Brief is one deal).
  const linked = await hubspot(env, "GET", `/crm/v4/objects/contacts/${contactId}/associations/deals?limit=100`);
  const ids = (linked.results ?? []).map((r) => String(r.toObjectId));
  let deal = null;
  if (ids.length) {
    const read = await hubspot(env, "POST", "/crm/v3/objects/deals/batch/read", { inputs: ids.map((id) => ({ id })), properties: ["hs_is_closed", "dealstage"] });
    deal = read.results.filter((d) => d.properties.hs_is_closed !== "true").sort((a, b) => Number(b.id) - Number(a.id))[0] ?? null;
  }

  let dealAction;
  if (!deal) {
    deal = await hubspot(env, "POST", "/crm/v3/objects/deals", {
      properties: { dealname: `${lead.company || lead.name || lead.email} - ${lead.formLabel}`, pipeline: env.HUBSPOT_PIPELINE || "default", dealstage: stage, ...owner },
      associations: [assoc(contactId, DEAL_TO_CONTACT)],
    });
    dealAction = "created";
  } else if (lead.formId === "kickoff" && env.HUBSPOT_KICKOFF_STAGE && deal.properties.dealstage !== stage) {
    await hubspot(env, "PATCH", `/crm/v3/objects/deals/${deal.id}`, { properties: { dealstage: stage } });
    dealAction = "moved to Kickoff";
  } else {
    dealAction = "updated";
  }

  const lines = lead.details.map((d) => `${d.label}: ${d.value}`);
  const body = lead.brief ? `${lines.join("\n")}\n\n${lead.brief}` : lines.join("\n");
  await hubspot(env, "POST", "/crm/v3/objects/tasks", {
    properties: {
      hs_timestamp: slot.at.toISOString(),
      hs_task_subject: `Follow up on ${lead.formLabel}: ${who(lead)}`,
      hs_task_body: escapeHtml(body).replace(/\n/g, "<br>"),
      hs_task_status: "NOT_STARTED",
      hs_task_priority: "HIGH",
      hs_task_type: "EMAIL",
      ...owner,
    },
    associations: [assoc(contactId, TASK_TO_CONTACT), assoc(deal.id, TASK_TO_DEAL)],
  });

  return {
    dealAction,
    contactUrl: `https://app.hubspot.com/contacts/${PORTAL_ID}/record/0-1/${contactId}`,
    dealUrl: `https://app.hubspot.com/contacts/${PORTAL_ID}/record/0-3/${deal.id}`,
  };
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---------- Google: auto-reply + calendar ---------- */

async function googleToken(env) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: env.GOOGLE_REFRESH_TOKEN, grant_type: "refresh_token" }),
  });
  if (!res.ok) throw new Error(`google token: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function google(token, url, body) {
  const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`google ${url}: ${res.status} ${await res.text()}`);
  return res.json();
}

function replyText(lead) {
  const hi = `Hi ${lead.first || "there"},`;
  const sign = "Simonne";
  if (lead.formId === "kickoff") {
    return {
      subject: "Your Kickoff Brief is in",
      text: [
        hi,
        `Your Kickoff Brief${lead.company ? ` for ${lead.company}` : ""} came through. Thank you for taking the time with it.`,
        "I'll read through everything and reach out within two business days with next steps. If you think of something you forgot, just reply to this email.",
        sign,
      ].join("\n\n"),
    };
  }
  return {
    subject: `Thanks for reaching out${lead.first ? `, ${lead.first}` : ""}`,
    text: [
      hi,
      `Thanks for getting in touch${lead.company ? ` about ${lead.company}` : ""}. Your note came through, and I'll get back to you within two business days.`,
      `Already decided to move forward? The Kickoff Brief covers everything I need to start your project, and it saves as you go:\n${lead.origin}/kickoff`,
      "Anything you forgot to mention? Just reply to this email.",
      sign,
    ].join("\n\n"),
  };
}

const b64 = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

async function autoReply(lead, token) {
  const { subject, text } = replyText(lead);
  const to = lead.name ? `=?UTF-8?B?${b64(lead.name)}?= <${lead.email}>` : lead.email;
  const message = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${b64(subject)}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(text).replace(/.{76}/g, "$&\r\n"),
  ].join("\r\n");
  const raw = b64(message).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  await google(token, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send", { raw });
  return {};
}

async function calendarFollowUp(lead, env, slot, token, hub) {
  const lines = [`${lead.formLabel} from ${who(lead)}`, "", ...lead.details.map((d) => `${d.label}: ${d.value}`)];
  if (hub?.ok) lines.push("", `HubSpot: ${hub.contactUrl}`);
  const calendar = encodeURIComponent(env.GOOGLE_CALENDAR_ID || "primary");
  const event = await google(token, `https://www.googleapis.com/calendar/v3/calendars/${calendar}/events`, {
    summary: `Follow up: ${who(lead)}`,
    description: lines.join("\n"),
    start: { dateTime: slot.start, timeZone: slot.timeZone },
    end: { dateTime: slot.end, timeZone: slot.timeZone },
    reminders: { useDefault: true },
  });
  return { url: event.htmlLink };
}

/* ---------- Slack ---------- */

const slackText = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function slackAlert(lead, env, slot, results) {
  const { hubspot: hub, email, calendar } = results;
  const short = lead.details.filter((d) => !LONG_FIELDS.has(d.key));
  const long = lead.details.filter((d) => LONG_FIELDS.has(d.key));
  const field = (d) => ({ type: "mrkdwn", text: `*${d.label}*\n${d.key === "email" ? `<mailto:${d.value}|${slackText(d.value)}>` : slackText(d.value).slice(0, 1900)}` });

  const status = (r, done, what) => (r?.skipped ? null : r?.ok ? done : `:warning: ${what} failed (see the Worker logs)`);
  const done = [
    status(hub, `Deal ${hub?.dealAction} with a task due ${slot.label}`, "HubSpot deal and task"),
    status(email, "Auto-reply sent", "Auto-reply"),
    status(calendar, `On your calendar for ${slot.label}`, "Calendar follow-up"),
  ].filter(Boolean);

  const buttons = [
    hub?.ok && { type: "button", style: "primary", text: { type: "plain_text", text: "Open in HubSpot" }, url: hub.contactUrl },
    hub?.ok && { type: "button", text: { type: "plain_text", text: "Open the deal" }, url: hub.dealUrl },
    calendar?.ok && calendar.url && { type: "button", text: { type: "plain_text", text: "Calendar event" }, url: calendar.url },
  ].filter(Boolean);

  const blocks = [
    { type: "header", text: { type: "plain_text", text: `New ${lead.formLabel}: ${who(lead)}`.slice(0, 150), emoji: true } },
    ...chunk(short.map(field), 10).map((fields) => ({ type: "section", fields })),
    ...long.map((d) => ({ type: "section", text: { type: "mrkdwn", text: `*${d.label}*\n${slackText(d.value).slice(0, 2800)}` } })),
    ...(lead.brief ? [{ type: "context", elements: [{ type: "mrkdwn", text: "The full Kickoff Brief is on the contact and the task in HubSpot." }] }] : []),
    ...(buttons.length ? [{ type: "actions", elements: buttons }] : []),
    ...(done.length ? [{ type: "context", elements: [{ type: "mrkdwn", text: done.join("  ·  ") }] }] : []),
  ];

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ channel: env.SLACK_CHANNEL, text: `New ${lead.formLabel} from ${who(lead)}`, blocks, unfurl_links: false }),
  });
  const out = await res.json();
  if (!out.ok) throw new Error(`slack chat.postMessage: ${out.error}`);
  return {};
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}
