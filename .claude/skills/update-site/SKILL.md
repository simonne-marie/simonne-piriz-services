---
name: update-site
description: Publish a change to Simonne's live portfolio site (simonnemarie.com) through a pull request, narrating each step in plain terms - branch, commit, push, pull request, review, merge, live. Use whenever Simonne asks to update, publish, ship, or push a change to the website, or asks "how do I get this live."
---

# Updating the live site

This project publishes through GitHub -> Cloudflare Pages. Only `main` is live,
so every change goes through a pull request: Vinny (the Slack bot) posts a
review card for it, and the change goes live when the PR is merged. Narrate
these steps out loud, in order, using this exact wording so the terminology
sticks over time. Do not skip the narration even for a small change.

The repo belongs to Simonne's personal GitHub account, `simonne-marie`. The gh
CLI's active account may be her VendGogh one, so run gh commands for this repo
with `GH_TOKEN=$(gh auth token --user simonne-marie)` in front.

## Step 1: Review the change
Say: "**Reviewing what changed** - here's what's different from the live site."
Run `git status` (and `git diff` if useful) and briefly summarize the files
touched in plain English (e.g. "I edited the resume page and the stylesheet").

## Step 2: Branch
Say: "**Making a branch** - a separate copy of the site where this change can
wait for review without touching the live site."
Run, with a short name for the change:
```
git checkout -b update/<short-name>
```

## Step 3: Commit
Say: "**Committing** - this saves a snapshot of the change with a short label,
like a save point."
Run:
```
git add -A
git commit -m "<short description of the change>"
```

## Step 4: Push
Say: "**Pushing to GitHub** - this uploads the branch. The live site doesn't
change yet."
Run:
```
git push -u origin HEAD
```

## Step 5: Pull request
Say: "**Opening a pull request** - this asks for the change to be added to the
live site. Vinny will post a review card for it in Slack."
Run `gh pr create --base main` with a plain-English title (it becomes the
card's headline) and a one-paragraph description (it becomes the card's
summary). Give Simonne the PR link.

## Step 6: Review and merge
Say: "**Reviewing and merging** - you look it over, then merge it, which is the
moment it goes live."
Stop here and let Simonne review: she can open the card in Slack, click
**Review the PR**, and merge on GitHub. Only merge it yourself if she asks.

## Step 7: Confirm it's live
Say: "**Live** - Cloudflare usually picks this up within a minute or two."
After the merge, switch back with `git checkout main && git pull`, wait
briefly, then check the deployed page (curl or the Browser tool) against the
live URL(s) - the workers.dev URL and, once connected, simonnemarie.com - to
confirm the change actually shows up before telling Simonne it's done.

## Reminder for Simonne
The words that matter, every time: **branch** (a safe copy to work on),
**commit** (save a snapshot), **push** (send it to GitHub), **pull request**
(ask for it to go live, and Vinny posts the card), **merge** (approve it),
**live** (Cloudflare auto-publishes it). She never has to run these herself -
Claude runs them - but repeating the words each time is intentional so they
become familiar.
