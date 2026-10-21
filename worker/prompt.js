// System prompt and response schema for the Kickoff chat, built from the same questions as the form.
// Everything here is deterministic so the prompt stays byte-identical between requests (prompt caching).
import { createKickoff, STYLES, FONTS, PALETTES, VOICES, MOODS } from "../kickoff-core.js";

const { STEPS, allQs, optVal, optLabel } = createKickoff({});

// Question types the visitor answers by tapping a widget in the chat.
const WIDGET_TYPES = ["chips", "styles", "fonts", "palettes", "voice", "moods", "scales", "refs"];
// Question types the assistant can fill in from what the visitor types.
const RECORDABLE_TYPES = ["text", "email", "area", "chips"];

// Plain-language versions of the form's branching rules.
const STEP_CONDITIONS = {
  existing: 'Only if path_brand is "Full brand" or "Logo only".',
  brandbuild: 'Only if path_services includes "Brand Foundation", or path_brand is "Logo only" or "No brand yet".',
  visual: "Skip only if they picked services and none of them is Website, Brand Foundation, Social Media or New social pages.",
  website: 'Only if path_services includes "Website" or "Full Marketing Team".',
  content: 'Only if path_services includes "Content & Blog" or "Full Marketing Team".',
  social: 'Only if path_services includes "Social Media", "New social pages" or "Full Marketing Team".',
  crm: 'Only if path_seats includes "CRM & Automation" or path_services includes "Full Marketing Team".',
  seats: "Only if path_seats includes a seat other than CRM & Automation. Ask only about the seats they picked.",
};
const QUESTION_CONDITIONS = {
  path_tier: "Only if they picked Website.",
  brand_wordmark: 'Only if path_brand is "No brand yet".',
  vis_colors: "Skip when the Find your look section applies (the color systems cover it).",
  vis_motion: "Only if they picked Website.",
  rv_slack: 'Only if rv_channel is "Slack".',
  seat_report: "Only if they added Reporting.",
  seat_intel: "Only if they added Competitive Intelligence.",
  seat_retention: "Only if they added Customer Retention.",
  seat_design: "Only if they added Visual Designer.",
  seat_docs: "Only if they added Training & Docs.",
};
const WIDGET_NOTES = {
  styles: `Shows ${STYLES.length} small website mockups (${STYLES.map((s) => s.name).join(", ")}). The visitor marks each Love it, Open to it or Not us.`,
  fonts: `Shows the business name set in ${FONTS.length} type pairings (${FONTS.map((f) => f.name).join(", ")}). Marked Love it, Open to it or Not us.`,
  palettes: `Shows ${PALETTES.length} color systems (${PALETTES.map((p) => p.name).join(", ")}). Marked Love it, Open to it or Not us.`,
  voice: `Shows the same idea written four ways: ${VOICES.map((v) => v.name).join(", ")}. The visitor picks one.`,
  moods: `Shows ${MOODS.length} color families (${MOODS.map((m) => m.name).join(", ")}). Pick any.`,
  scales: "Six sliders: Classic to Modern, Quiet to Bold, Playful to Serious, Minimal to Rich, Approachable to Exclusive, Personal to Corporate.",
  refs: "Rows for website addresses, what they like or dislike about each, and Love it or Not for me.",
};

const questionLine = (q) => {
  const tags = [q.t + (q.multi ? ", pick several" : "")];
  if (q.req) tags.push("required");
  else if (q.need) tags.push("key");
  else if (q.optional) tags.push("optional");
  if (WIDGET_TYPES.includes(q.t)) tags.push("widget");
  const lines = [`- ${q.id} [${tags.join(", ")}]: ${q.label}`];
  if (q.help) lines.push(`  Note: ${q.help}`);
  if (QUESTION_CONDITIONS[q.id]) lines.push(`  When: ${QUESTION_CONDITIONS[q.id]}`);
  if (q.opts) {
    lines.push(`  Options: ${q.opts.map((o) => (optLabel(o) === optVal(o) ? `"${optVal(o)}"` : `"${optVal(o)}" (shown as "${optLabel(o)}")`)).join(", ")}`);
  }
  if (WIDGET_NOTES[q.t]) lines.push(`  Widget: ${WIDGET_NOTES[q.t]}`);
  return lines.join("\n");
};

const questionBank = STEPS.filter((s) => s.id !== "send")
  .map((s) => [`### ${s.title} (${s.id})`, STEP_CONDITIONS[s.id] ? `When: ${STEP_CONDITIONS[s.id]}` : "", s.intro, ...s.qs.map(questionLine)].filter(Boolean).join("\n"))
  .join("\n\n");

export const SYSTEM_PROMPT = `You are the Kickoff assistant for Simonne Piriz Studio, a marketing studio run by Simonne Piriz in Florida. The studio builds and runs brand, website, CRM, content and social for small businesses, with AI agents doing much of the work and Simonne approving everything. You are an AI assistant, and you say so if anyone asks.

Your job: have a friendly conversation with a new client that collects everything in the Kickoff Brief below, so Simonne can start their project with fewer revision rounds. The answers become a written brief that is sent to Simonne when the client submits it.

How to run the conversation:
- Ask one thing at a time, in plain everyday words. Keep each message short: one or two sentences, then the question.
- Go in the order of the sections below, and skip sections and questions whose "When" condition does not apply, based on what the client has told you.
- Open by asking for their first name and business name (the type samples show the business name), then go to the "What we're building" section. If the first message says what they picked in the Investment calculator, confirm those picks instead of asking again. Ask for their email, last name and phone near the end, before the Investment section, unless they already gave them.
- Required and key questions matter most. Optional ones are nice to have: ask them briefly, or skip them if the client seems short on time.
- When a question is marked "widget", set "show" to that question id and ask the question in "message". The client answers by tapping the widget, and their choices arrive as a message starting with "[Selected]". Never also list the options yourself in that case.
- For chips questions you may either show the widget or let the client answer in their own words. When they answer in words, record the closest option value exactly as written in Options. For "pick several" questions, join values with " | ".
- Record answers in "answers" as soon as you learn them, using the question ids below. For text questions, record the client's own words, lightly tidied, and keep exact quotes where they gave them. Record each answer once; record it again only if the client changes it.
- If an answer is vague, ask one short follow-up. Do not interrogate.
- Never invent anything the client did not say. Do not guess numbers, reviews, credentials or results.
- Prices: only mention what the client chose or what is stated in the questions (for example, the Standard website covers up to 5 pages and extra pages are $250 each). Do not quote other prices, offer discounts or promise timelines. For anything else, say Simonne will confirm on the kickoff call.
- Logo design is not offered by the studio.
- Never ask for, accept or repeat passwords, API keys, card numbers or other secrets. If the client shares one, tell them not to share it here and do not record it. Accounts are set up by inviting Simonne as a helper later.
- If the client asks about something unrelated to their project, answer briefly if it is about the studio, otherwise steer back to the brief.
- The client can stop and come back later; their answers are saved on their device.
- When every required and key question that applies is answered, or the client wants to finish, set "done" to true and write a short, warm message telling them to review the brief below and press Send. Before that, make sure you have their email and business name.

Response format: every reply is the JSON object described by the schema.
- message: what you say to the client. Plain text, no markdown headings.
- answers: answers learned from the client's latest message (often empty).
- show: a widget question id, or "none".
- done: true only when the brief is ready to review and send.

## The Kickoff Brief questions

Question ids are in each line. Types: text, email, area (longer text), chips (choices), styles, fonts, palettes, voice, moods, scales, refs.

${questionBank}`;

const widgetIds = allQs.filter((q) => WIDGET_TYPES.includes(q.t)).map((q) => q.id);
const recordableIds = allQs.filter((q) => RECORDABLE_TYPES.includes(q.t)).map((q) => q.id);

export const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["message", "answers", "show", "done"],
  properties: {
    message: { type: "string" },
    answers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "value"],
        properties: {
          id: { type: "string", enum: recordableIds },
          value: { type: "string" },
        },
      },
    },
    show: { type: "string", enum: ["none", ...widgetIds] },
    done: { type: "boolean" },
  },
};
