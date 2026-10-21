// Site Worker. Static pages are served straight from the assets; this only handles
// POST /api/lead, which turns a Contact page inquiry into a lead brief in Slack.
//
// Needs two secrets on the Worker (Cloudflare dashboard > Workers > simonne-piriz-services
// > Settings > Variables and Secrets): SLACK_BOT_TOKEN (the same bot as Vinny) and
// SLACK_CHANNEL (a channel ID like C0123ABCD; invite the bot to it). Without them the
// route answers 204 and does nothing, so the form keeps working either way.

const HUBSPOT_PORTAL_ID = "247415032";
const MAX_FIELD = 2000;

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname !== "/api/lead") return env.ASSETS.fetch(request);
		if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });

		// Only accept posts from the site's own pages.
		const origin = request.headers.get("Origin");
		if (origin && new URL(origin).host !== url.host) return new Response("Forbidden", { status: 403 });

		let lead;
		try {
			lead = clean(await request.json());
		} catch {
			return new Response("Bad request", { status: 400 });
		}
		if (!/^[^\s@<>|"]+@[^\s@<>|"]+\.[^\s@<>|"]+$/.test(lead.email)) return new Response("Bad request", { status: 400 });

		if (!env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL) {
			console.log("[lead] SLACK_BOT_TOKEN or SLACK_CHANNEL is unset; skipping");
			return new Response(null, { status: 204 });
		}

		const res = await fetch("https://slack.com/api/chat.postMessage", {
			method: "POST",
			headers: { Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`, "Content-Type": "application/json; charset=utf-8" },
			body: JSON.stringify({
				channel: env.SLACK_CHANNEL,
				text: `New inquiry from ${lead.company || lead.email}`, // notification fallback
				blocks: blocks(lead),
				unfurl_links: false,
				unfurl_media: false,
			}),
		});
		const json = await res.json().catch(() => ({}));
		if (!json.ok) {
			console.log(`[lead] slack chat.postMessage: ${json.error ?? res.status}`);
			return new Response("Slack post failed", { status: 502 });
		}
		return new Response(null, { status: 204 });
	},
};

// Keep only the fields the form sends, as trimmed, length-capped strings.
function clean(body) {
	const str = (v) => (typeof v === "string" ? v.trim().slice(0, MAX_FIELD) : "");
	return {
		firstname: str(body.firstname),
		lastname: str(body.lastname),
		email: str(body.email),
		company: str(body.company),
		website: str(body.website),
		need: str(body.need),
		services: Array.isArray(body.services) ? body.services.map(str).filter(Boolean).slice(0, 10) : [],
		company_size: str(body.company_size),
		timeline: str(body.timeline),
		industry: str(body.industry),
		source: str(body.source),
		from_calculator: body.from_calculator === true,
		hubspot_ok: body.hubspot_ok !== false,
	};
}

// Slack mrkdwn treats &, < and > as control characters.
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cap = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const quote = (s) => cap(esc(s), 1500).split("\n").map((l) => `> ${l}`).join("\n");

function siteUrl(website) {
	if (!website) return null;
	try {
		const u = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
		return /^https?:$/.test(u.protocol) ? u.href.replace(/\|/g, "%7C") : null;
	} catch {
		return null;
	}
}

// A one-line read on the lead, from what they picked.
function quickRead(lead) {
	const notes = [];
	if (lead.timeline === "ASAP") notes.push(":fire: Wants to start ASAP");
	else if (lead.timeline === "Next 1-3 months") notes.push(":calendar: Starting in the next 1–3 months");
	else if (lead.timeline === "Just exploring") notes.push(":eyes: Just exploring");
	const picked = lead.services.filter((s) => s !== "Not sure yet.");
	if (lead.services.includes("Not sure yet.") || !lead.services.length) notes.push("needs a scoping call to pick services");
	else if (picked.length > 1) notes.push(`interested in ${picked.length} services`);
	if (lead.from_calculator) notes.push("priced it in the Investment calculator first");
	if (!lead.need) notes.push("no project details given");
	return notes.join("  ·  ");
}

function blocks(lead) {
	const name = [lead.firstname, lead.lastname].filter(Boolean).join(" ");
	const site = siteUrl(lead.website);
	const who = [
		name ? `*${esc(name)}*` : null,
		`<mailto:${lead.email}|${esc(lead.email)}>`,
		lead.company ? esc(lead.company) : null,
		site ? `<${site}|${esc(cap(lead.website.replace(/^https?:\/\//i, "").replace(/\/$/, ""), 60))}>` : null,
	]
		.filter(Boolean)
		.join("  ·  ");

	const fields = [
		["Services", lead.services.map((s) => s.replace(/\.$/, "")).join(", ")],
		["Timeline", lead.timeline],
		["Company size", lead.company_size],
		["Industry", lead.industry],
		["Heard about me", lead.source],
	]
		.filter(([, v]) => v)
		.map(([k, v]) => ({ type: "mrkdwn", text: `*${k}*\n${cap(esc(v), 300)}` }));

	const read = quickRead(lead);
	const firstName = lead.firstname || "there";
	const reply = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent("Re: your inquiry")}&body=${encodeURIComponent(`Hi ${firstName},\n\n`)}`;
	const hubspot = `https://app.hubspot.com/contacts/${HUBSPOT_PORTAL_ID}/objects/0-1/views/all/list?query=${encodeURIComponent(lead.email)}`;
	const now = Math.floor(Date.now() / 1000);

	return [
		{ type: "header", text: { type: "plain_text", text: cap(`New inquiry: ${lead.company || name || lead.email}`, 150), emoji: true } },
		...(lead.hubspot_ok
			? []
			: [{ type: "section", text: { type: "mrkdwn", text: ":warning: *HubSpot didn't accept this one.* It isn't in the CRM, so add it by hand or reply straight from here." } }]),
		{ type: "section", text: { type: "mrkdwn", text: who } },
		{ type: "section", text: { type: "mrkdwn", text: lead.need ? `*What they need*\n${quote(lead.need)}` : "_No project details given._" } },
		...(fields.length ? [{ type: "section", fields }] : []),
		...(read ? [{ type: "context", elements: [{ type: "mrkdwn", text: `*Quick read:* ${read}` }] }] : []),
		{
			type: "actions",
			elements: [
				{ type: "button", style: "primary", text: { type: "plain_text", text: "Reply in Gmail" }, url: reply },
				...(lead.hubspot_ok ? [{ type: "button", text: { type: "plain_text", text: "Open in HubSpot" }, url: hubspot }] : []),
				...(site ? [{ type: "button", text: { type: "plain_text", text: "Visit their site" }, url: site }] : []),
			],
		},
		{ type: "context", elements: [{ type: "mrkdwn", text: `From the Contact page · <!date^${now}^{date_short_pretty} at {time}|just now>` }] },
	];
}
