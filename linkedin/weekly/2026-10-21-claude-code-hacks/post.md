# Weekly LinkedIn: 5 Claude Code moves I'd teach you first

Week of Oct 21, 2026 · Weekly expertise post (kept apart from the social playbook)
Visual: `visual.png` (1080 x 1350, 4:5 feed size). Source: `visual.html`.

---

Five weeks ago I started building my studio site in Claude Code.

19 live updates later, these are the five moves I'd teach anyone on day one. You don't need a developer background for any of them.

1/ /init
Run it once in your project. It writes a CLAUDE.md file that tells Claude how your project works, so you stop re-explaining the basics every session.

2/ Skills (.claude/skills/)
A skill is a plain-English instruction file for a workflow you repeat. Mine is called update-site. When I say "update the site," it makes a branch, saves the change, opens a pull request, and explains each step as it goes. Every one of those 19 updates went through it.

3/ Shift + Tab for plan mode
Before a bigger change, switch to plan mode. Claude lays out what it wants to do and waits. You read the plan, push back, then approve. It's the same rule I run my client work on: the agent drafts, a human approves.

4/ /code-review
A second set of eyes on the change before it goes live. It catches the small things that are easy to miss when you're moving fast. I also built a small Slack bot, Vinny, that posts a review card for every update so nothing ships without me seeing it.

5/ /fewer-permission-prompts
If you're tired of approving the same safe commands over and over, this looks at what you actually run and pre-approves the read-only ones. Fewer interruptions, same guardrails.

None of this is magic. It's the same systems thinking I've used in marketing ops for 10+ years, applied to a new tool.

If you're trying one of these and get stuck, drop a question in the comments or send me a message. I'm happy to walk you through your first skill.

Which one are you trying first?

#ClaudeCode #MarketingOps #AIAgents #SmallBusinessMarketing

---

## Notes before posting

- Every number is from this repo: 19 merged pull requests, first commit Sep 16, 2026, and the Vinny workflow in `.github/workflows/slack-card.yml`. Nothing about clients or prospects.
- Upload `visual.png` as the image. LinkedIn shows the first two lines before "see more," so the hook is the first two lines.
- If you'd like it shorter, cut the last sentence of #4 (the Vinny line). The stat on the visual still covers it.
- `linkedin/` is in `.assetsignore`, so this folder never publishes to the live site.
