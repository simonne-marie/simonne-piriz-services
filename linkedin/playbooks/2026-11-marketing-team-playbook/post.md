# LinkedIn: The small business marketing team playbook

Files in this folder:
- `playbook.pdf`: the 11-page playbook (1080 x 1350 pages, LinkedIn document size). Source: `playbook.html`. Page images are in `pages/`.
- `teaser.mp4`: 10-second animated teaser (1080 x 1350, H.264). Source: `teaser.html`. `teaser-still.png` is a single frame to use as a thumbnail.

---

## Post copy

Most AI playbooks for small businesses skip the part where the agents get it wrong.

So I wrote one that doesn't. It's the exact system I run my own studio on.

1/ The stack
Brand docs, website, CRM, content. Brand docs come first, because they're the instruction manual every agent works from.

2/ The review loop
Every website change starts on a copy, opens a pull request, and posts a review card in Slack. Nothing goes live until I merge it. 19 updates so far, every one reviewed.

3/ Where agents fall short
One of mine pointed my publishing skill at the wrong website. They'll invent proof if you let them, they miss contradictions, and they default to generic. There's a page on what I check for each.

4/ Intake that drafts for you
My Kickoff Brief asks people to pick examples instead of describing their taste, then lands in HubSpot as a brief I can build from.

5/ A 5-day rollout
One piece a day, starting with the brand doc.

None of it needs a developer. It does need someone deciding what good looks like.

11 pages, free, link in the first comment. If you get stuck on a page, ask me. Happy to help.

#MarketingOps #SmallBusinessMarketing #AIAgents

---

## How to post it (pick one)

**Option A, recommended: post the PDF as a document.** Upload `playbook.pdf` as a LinkedIn document post. People swipe through all 11 pages in the feed with no gate. Change the last line to: "All 11 pages are below. If you get stuck on one, ask me."

**Option B: the teaser video plus a link.** Post `teaser.mp4` with the copy above, and put the PDF link in the first comment. You need somewhere to host the PDF first (a Google Drive link, or a page on your site through a normal site update).

On "Comment PLAYBOOK to get it": it does boost reach, but it's the move the people you most want to impress recognise as engagement bait. Both options above skip it.

## Fact check

Every claim comes from this repo:
- 19 merged pull requests on `main`; first commit Sep 16, 2026 (about 9 weeks ago).
- Wrong domain: the Oct 1 agent commit pointed the publishing skill at the portfolio domain, and the Oct 15 commit corrected it. (The comment at the top of `.github/workflows/slack-card.yml` still names the old domain.)
- The "don't invent reviews, numbers, credentials or results" rule and the "flag answers that pull against each other" step are both in `kickoff.js`.
- The "generic first draft that got cut" is the "how it works" intro-post idea from our planning conversation.
- The career lines on page 2 (a decade-plus in SaaS and healthcare, Atlassian scale) come from your site's homepage.
