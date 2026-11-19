# Carousel and download prompts

Paste any prompt below into a Claude Code session in this repo to get a draft carousel (a PDF of 1080 x 1350 pages) plus post copy. Each one is built from something you've actually built or worked on.

## The bar (applies to every prompt)

Paste this block above whichever prompt you use:

> Build a LinkedIn carousel as a PDF of 1080 x 1350 pages, matching `linkedin/playbooks/2026-11-marketing-team-playbook/playbook.html` (same tokens, fonts, logo and page structure). Save it in a new folder under `linkedin/playbooks/`, with a `post.md` for the copy.
> Rules:
> - Use only things I've built, worked on, or talked through with you. Cite the file, commit or conversation for every claim in a "Fact check" section of `post.md`. If a claim can't be sourced, cut it.
> - Nothing from or about clients or prospective clients.
> - At least one page must cover what didn't work, what an agent got wrong, or what I'd do differently.
> - No hype words (game-changer, revolutionary, 10x, insane, unlock), no "AI can now…" hooks, and no tool worship. Tools are what I use, not the point of the post.
> - Don't borrow lines or layouts from other creators' posts.
> - The tone teaches. End on an offer to help, not a gate.

---

## 1. The brand doc my agents work from

> Make an 8-page fill-in-the-blanks carousel of the brand doc template from page 4 of the playbook: positioning, voice and tone with "we say this, not that" examples, words we never use, color and type, and allowed proof. Show a worked example on each page using my own studio's brand (from `styles.css` and the homepage copy in `index.html`). Final page: the test, "if a new hire couldn't write a good post from it, an agent can't either."

## 2. Anatomy of a review card

> Make a 7-page carousel explaining Vinny, my Slack review card, from `.github/workflows/slack-card.yml` and `.github/slack-card.mjs`. Cover what triggers a card, what's on it and why, what gets threaded under it (pushes, comments, reviews, the merge), and how someone could set up their own. Include the limitation: it only helps if someone actually reads the card before merging.

## 3. The Kickoff Brief, question by question

> Make a 9-page carousel walking through the Kickoff Brief in `kickoff.js`. For each section, say what it asks and why it exists. Feature the visual pickers (styles, fonts, palettes) and the rules handed to whoever builds from it: use the client's own words, no invented proof, flag answers that pull against each other. Show the question I reworded for product businesses as a before/after, from the commit history.

## 4. What I check before an agent's draft goes live

> Make a 6-page checklist carousel from page 9 of the playbook and the git history: confidently wrong facts, invented proof, missed contradictions, generic output, and decisions that should stay with a person. One page per check, each with a real example and the exact fix I put in place.

## 5. The seat map

> Make a one-page overview plus a 6-page carousel of the agent org chart in `services.html`: the three core seats and the six open seats, with what each one does, what it hands back, and what stays with me. Lay the overview out as a single grid map of the whole team. Only include seats that are actually on the site.

## 6. Measurement before marketing

> Make a 6-page carousel on the boring setup that comes before any posting: Google Analytics, Google Tag Manager, a sitemap, and a privacy policy updated to match, from the commits that added each one to my site. Include why each matters for a small business and the order to do them in. Include the limitation: the data means nothing until someone looks at it monthly.

## 7. Teardown: the generic draft vs. the edited one

> Make a before/after carousel from a real agent draft and my edited version. I'll paste both. One page per change, each naming what I changed and why (voice, accuracy, claims, structure). End with the pattern across all the edits. This is the strongest proof of judgment, so don't soften the critique of the first draft.

## 8. Systems I built in marketing ops (career receipts)

> Make an 8-page carousel of marketing operations systems I've built in past roles, using only the results on my résumé (`simonne-piriz-resume-mops.pdf` in my Google Drive). For each system, cover the problem, what I built, and the result. Check with me before including any employer-specific numbers, and leave out anything confidential.
