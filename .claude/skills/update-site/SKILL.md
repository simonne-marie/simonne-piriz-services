---
name: update-site
description: Publish a change to Simonne's live portfolio site (simonnemarie.com), narrating each step in plain terms - commit, push, live. Use whenever Simonne asks to update, publish, ship, or push a change to the website, or asks "how do I get this live."
---

# Updating the live site

This project publishes through GitHub -> Cloudflare Pages. Every time a change
is ready to go live, narrate these steps out loud, in order, using this exact
wording so the terminology sticks over time. Do not skip the narration even
for a small change.

## Step 1: Review the change
Say: "**Reviewing what changed** - here's what's different from the live site."
Run `git status` (and `git diff` if useful) and briefly summarize the files
touched in plain English (e.g. "I edited the resume page and the stylesheet").

## Step 2: Commit
Say: "**Committing** - this saves a snapshot of the change with a short label,
like a save point."
Run:
```
git add -A
git commit -m "<short description of the change>"
```

## Step 3: Push
Say: "**Pushing to GitHub** - this uploads that snapshot, which is what tells
Cloudflare to rebuild the live site."
Run:
```
git push
```

## Step 4: Confirm it's live
Say: "**Live** - Cloudflare usually picks this up within a minute or two."
Wait briefly, then check the deployed page (curl or the Browser tool) against
the live URL(s) - the workers.dev URL and, once connected, simonnemarie.com -
to confirm the change actually shows up before telling Simonne it's done.

## Reminder for Simonne
The three words that matter, every time: **commit** (save a snapshot),
**push** (send it to GitHub), **live** (Cloudflare auto-publishes it). She
never has to run these herself - Claude runs them - but repeating the words
each time is intentional so they become familiar.
