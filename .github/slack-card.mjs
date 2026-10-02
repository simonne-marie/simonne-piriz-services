// Vinny: posts a review card to Slack when a site PR opens, and threads later activity
// under it. Modelled on `site` and `relay` in vendgogh/marketing's scripts/slack-blog.mjs.
//
// The card's Slack address is kept in a hidden marker comment on the PR, so later
// runs know which thread to post into.
import { readFile } from 'node:fs/promises';

const token = process.env.SLACK_BOT_TOKEN;
const channel = process.env.SLACK_CHANNEL;
const gh = process.env.GH_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
const event = process.env.GITHUB_EVENT_NAME;
const MARKER = /<!-- slack-thread channel=(\S+) ts=(\S+) -->/g;

async function slack(method, body) {
	const res = await fetch(`https://slack.com/api/${method}`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
		body: JSON.stringify(body)
	});
	const json = await res.json();
	if (!json.ok) throw new Error(`slack ${method}: ${json.error}`);
	return json;
}

async function github(path, init = {}) {
	const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
		...init,
		headers: { Authorization: `Bearer ${gh}`, Accept: 'application/vnd.github+json', ...init.headers }
	});
	if (!res.ok) throw new Error(`github ${path}: ${res.status} ${await res.text()}`);
	return res.json();
}

async function threadOf(number) {
	const comments = await github(`/issues/${number}/comments?per_page=100`);
	const all = comments.flatMap((c) => [...(c.body ?? '').matchAll(MARKER)]);
	if (!all.length) return null;
	const found = all[all.length - 1];
	return { channel: found[1], ts: found[2] };
}

// The PR description's first paragraph, without HTML comments, trimmed for Slack.
function summary(body) {
	const text = (body ?? '').replace(/<!--[\s\S]*?-->/g, '').trim().split(/\n\s*\n/)[0] ?? '';
	return text.length > 300 ? `${text.slice(0, 297)}…` : text;
}

function blocks(pr, files) {
	const names = files.map((f) => `\`${f.filename}\``);
	const where = [...names.slice(0, 6), ...(names.length > 6 ? [`+${names.length - 6} more`] : [])].join(', ');
	const facts = [
		`<${pr.html_url}|#${pr.number}>`,
		`by ${pr.user.login}`,
		`${files.length} file${files.length === 1 ? '' : 's'}`,
		where ? `changes ${where}` : null
	]
		.filter(Boolean)
		.join('  ·  ');
	const about = summary(pr.body);
	return [
		{ type: 'header', text: { type: 'plain_text', text: `Site update: ${pr.title}`.slice(0, 150), emoji: true } },
		...(about ? [{ type: 'section', text: { type: 'mrkdwn', text: about } }] : []),
		{ type: 'context', elements: [{ type: 'mrkdwn', text: facts }] },
		{
			type: 'actions',
			elements: [
				{ type: 'button', style: 'primary', text: { type: 'plain_text', text: 'Review the PR' }, url: pr.html_url },
				{ type: 'button', text: { type: 'plain_text', text: 'See the changes' }, url: `${pr.html_url}/files` }
			]
		},
		{
			type: 'context',
			elements: [{ type: 'mrkdwn', text: 'Pushes, comments and reviews show up in this thread. Merging puts it live on simonnemarie.com.' }]
		}
	];
}

async function announce(pr) {
	const files = await github(`/pulls/${pr.number}/files?per_page=100`);
	const res = await slack('chat.postMessage', {
		channel,
		text: `Site update for review: ${pr.title}`, // notification fallback
		blocks: blocks(pr, files),
		unfurl_links: false
	});
	await github(`/issues/${pr.number}/comments`, {
		method: 'POST',
		body: JSON.stringify({ body: `Posted to Slack for review.\n\n<!-- slack-thread channel=${res.channel} ts=${res.ts} -->` })
	});
	console.log(`[slack] announced PR #${pr.number}`);
}

async function reply(number, text) {
	const thread = await threadOf(number);
	if (!thread) return console.log(`[slack] PR #${number} has no card yet; nothing to reply to`);
	await slack('chat.postMessage', { channel: thread.channel, thread_ts: thread.ts, text, unfurl_links: false });
	console.log(`[slack] replied in PR #${number}'s thread`);
}

const quote = (s) => (s ?? '').trim().slice(0, 500).split('\n').map((l) => `> ${l}`).join('\n');

async function main() {
	const payload = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
	const action = payload.action;

	if (event === 'pull_request') {
		const pr = payload.pull_request;
		const link = `<${pr.html_url}|PR #${pr.number}>`;
		if (action === 'closed') {
			return reply(pr.number, pr.merged ? `:rocket: ${link} was merged. Cloudflare will have it live on simonnemarie.com in a minute or two.` : `:no_entry_sign: ${link} was closed without merging.`);
		}
		const thread = await threadOf(pr.number);
		if (thread) {
			if (action !== 'synchronize') return console.log(`[slack] PR #${pr.number} already has a card`);
			return reply(pr.number, `:arrows_counterclockwise: New push \`${pr.head.sha.slice(0, 7)}\` on ${link}.`);
		}
		if (pr.draft) return console.log(`[slack] PR #${pr.number} is a draft; it gets a card when marked ready`);
		return announce(pr);
	}

	if (event === 'issue_comment') {
		const c = payload.comment;
		return reply(payload.issue.number, `:speech_balloon: *${c.user.login}* <${c.html_url}|commented>:\n${quote(c.body)}`);
	}

	if (event === 'pull_request_review') {
		const r = payload.review;
		const verdict = { approved: ':white_check_mark: approved', changes_requested: ':warning: asked for changes on', commented: ':speech_balloon: reviewed' }[r.state] ?? 'reviewed';
		const body = r.body ? `\n${quote(r.body)}` : '';
		return reply(payload.pull_request.number, `*${r.user.login}* ${verdict} <${r.html_url}|PR #${payload.pull_request.number}>.${body}`);
	}
}

if (!token || !channel) console.log('[slack] SLACK_BOT_TOKEN or SLACK_CHANNEL is unset; skipping');
else await main();
