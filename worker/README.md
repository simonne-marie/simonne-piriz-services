# Form automation

When someone sends the **contact inquiry** or the **Kickoff Brief**, the site's Worker
(`worker/index.js`) passes it to HubSpot exactly as before, then:

1. **HubSpot deal + task.** Finds the person's open deal, or creates one in your pipeline, and
   adds a high-priority follow-up task for the next weekday at 10:00. A Kickoff Brief moves an
   existing deal to the Kickoff stage, so an inquiry followed by a brief stays one deal.
2. **Auto-reply.** Sends a short thank-you from your Gmail, so replies land in your inbox.
3. **Calendar follow-up.** Adds a 30-minute "Follow up: Name (Company)" event at the same time.
4. **Slack alert.** Vinny posts a card with their details, buttons to HubSpot and the calendar
   event, and a line saying which of steps 1-3 worked.

Each step turns on once its keys are added in Cloudflare, so you can set them up one at a time.
If a step fails, the visitor never sees it; the Slack card shows a warning instead.

## Where keys go

Cloudflare dashboard → **Workers & Pages** → **simonne-piriz-services** → **Settings** →
**Variables and Secrets** → **Add** → type **Secret**. Secrets stay put when the site redeploys.

## 1. Slack alert

| Secret | Value |
| --- | --- |
| `SLACK_BOT_TOKEN` | Vinny's bot token (the same one saved in GitHub as `SLACK_BOT_TOKEN`; it starts `xoxb-`). Find it at api.slack.com/apps → Vinny → OAuth & Permissions. |
| `SLACK_CHANNEL` | The channel ID to post in (in Slack: open the channel → its name → the ID at the bottom, like `C0123ABCD`). Invite Vinny to the channel if it is a new one. |

## 2. HubSpot deal + task

In HubSpot: **Settings** → **Integrations** → **Private Apps** (or **Legacy Apps**) → create
an app named "Website forms" with these scopes:
`crm.objects.contacts.read`, `crm.objects.contacts.write`, `crm.objects.deals.read`,
`crm.objects.deals.write`. (Tasks use the contacts scopes; if HubSpot lists a separate task
scope, tick it too.)

| Secret | Value |
| --- | --- |
| `HUBSPOT_TOKEN` | The app's access token (starts `pat-`). |
| `HUBSPOT_OWNER_ID` | Optional. Assigns new deals and tasks to you. HubSpot → Settings → Properties → search "Contact owner" → open it; your name's internal value is your owner ID. Without it, tasks are unassigned. |

The pipeline and stages are in `wrangler.jsonc` and use HubSpot's default sales pipeline:
new inquiries start at **Appointment scheduled** and a Kickoff Brief moves the deal to
**Decision maker bought-in**. If you've renamed or rebuilt your pipeline, change
`HUBSPOT_PIPELINE`, `HUBSPOT_DEAL_STAGE` and `HUBSPOT_KICKOFF_STAGE` to the internal IDs from
Settings → Objects → Deals → Pipelines.

## 3 + 4. Auto-reply and calendar (one Google key covers both)

1. At console.cloud.google.com, create a project, then enable the **Gmail API** and the
   **Google Calendar API** (APIs & Services → Library).
2. APIs & Services → **OAuth consent screen**: External, add yourself as a test user, then
   **Publish app** (otherwise Google expires the key every 7 days). Google will show an
   "unverified app" warning when you sign in below; that's expected for a personal app.
3. APIs & Services → **Credentials** → Create credentials → **OAuth client ID** → Web
   application. Under Authorized redirect URIs add `https://developers.google.com/oauthplayground`.
   Copy the client ID and secret.
4. Open developers.google.com/oauthplayground → gear icon → tick **Use your own OAuth
   credentials** → paste them. In the scope box enter
   `https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.events`
   → **Authorize APIs** → sign in as simonnemv@gmail.com → **Exchange authorization code for
   tokens**. Copy the **Refresh token**.

| Secret | Value |
| --- | --- |
| `GOOGLE_CLIENT_ID` | From step 3. |
| `GOOGLE_CLIENT_SECRET` | From step 3. |
| `GOOGLE_REFRESH_TOKEN` | From step 4. |

Follow-ups are set for 10:00 in `FOLLOW_UP_TIMEZONE` (`America/New_York` in `wrangler.jsonc`).
The auto-reply wording is in `replyText()` in `worker/index.js`.

## Checking it

Send yourself a test through each form on the live site. Within a few seconds you should get
the Slack card, the auto-reply, the calendar event and the HubSpot task. If something doesn't
show, Cloudflare → the Worker → **Logs** shows lines starting `[form]` explaining what failed.

Opening the site with `npx serve` won't send forms, since `/api/submit` only exists on
Cloudflare. To try it locally, run `npx wrangler dev` and put the secrets in a `.dev.vars` file
(never commit that file).
