# IntentConfirm

**Clarify the choices that change the result, then let the same AI do the work.**

IntentConfirm is an MIT-licensed Skill for your existing AI assistant. It preserves explicit constraints, asks a few concrete questions about consequential gaps, and continues with a compact brief. Clear, bounded requests can proceed without extra questions. No separate model API or server is required; your host's normal model costs still apply.

[Download the Skill](https://github.com/pruettlazaro143-a11y/intentconfirm/raw/refs/heads/main/downloads/intentconfirm-skill.zip) · [Demo](https://intentconfirm-demo.q788x1zq.chatgpt.site) · [中文](../README.md)

## Quick start

1. Download and extract the Skill ZIP. It contains one `intentconfirm` folder.
2. Copy it to your project's `.bob/skills/` for IBM Bob, or `.claude/skills/` for Claude Code. The final path must end in `intentconfirm/SKILL.md`.
3. Open that project in the assistant and start a new conversation:

> Use IntentConfirm to help me build a personal study tracker. Ask about choices that materially change the result, preserve the constraints I already gave, and implement the first version when the brief is clear enough.

Check Bob Settings → Skills for discovery. Claude Code documents direct invocation with `/intentconfirm`. Bob has a real recorded end-to-end case; Claude Code installation follows its documentation but has not been end-to-end tested here. Other hosts need their documented installation path. Text-only clients can receive the full [SKILL.md](../.bob/skills/intentconfirm/SKILL.md) as context, without native discovery or persistence guarantees.

## Optional installer

Download or clone the full repository and run from its root with Python 3.9+:

```sh
python3 scripts/install_skill.py --client bob --project "/path/to/existing-project"
python3 scripts/install_skill.py --client bob --project "/path/to/existing-project" --check
# Or: --client claude
```

The installer works offline and refuses to overwrite a differing installation. File checks do not prove model activation. Back up a customized old Skill outside the host's Skills folders before replacing it. Remove only your installed `intentconfirm` folder to uninstall.

## What to expect

- One to three high-impact questions per round, with concrete choices and free-text alternatives.
- Existing constraints retained; assumptions separated from user choices.
- Selective clarification after a change, preserving unrelated decisions.
- Scoped delegation: “you decide” permits a default for that choice, not unrelated commitments.
- A brief and continuation of the already-authorized task.

The package supplies instructions, not a different model. Results depend on the host's capabilities, context and instruction following. It cannot guarantee complete understanding or enforce independent authorization.

## Evidence and limits

A real IBM Bob session clarified a study tracker through the user's **BAA** and **C** answers, produced a standalone HTML app, and received positive user feedback. [Conversation](REAL_BOB_SESSION.md) · [Screenshots](../bob_sessions/README.md) · [Working output](https://intentconfirm-demo.q788x1zq.chatgpt.site/study-log/).

The demo website is a recorded walkthrough and output example, not a live AI service. This is one accepted case, not a controlled benchmark. Writing and planning prompts are illustrative examples, not separately validated cases.

The current package passes 38 record-tool tests, 8 distribution tests and 47 optional web-prototype tests. The base Skill needs neither Python nor Node. Python 3.9+ is only needed for optional tools; Node 18+ is only needed for the retained web prototype. DeepSeek integration is optional, separate from the Skill, and not verified with a live call.

Bob's development work and Codex's subsequent reviews are attributed separately in [development records](BOB_SKILL_COMPLETION.md) and [review notes](CODEX_SKILL_REVIEW.md).

## Privacy and contributions

The Skill and local record scripts do not make model-network requests themselves. Your assistant still processes your messages under its own data policy; local installation does not mean local model inference. Do not publish private conversations or keys in feedback.

[Report an issue](https://github.com/pruettlazaro143-a11y/intentconfirm/issues/new/choose) · [Contributing](../CONTRIBUTING.md) · [Changelog](../CHANGELOG.md) · [MIT](../LICENSE)

Installation references checked 2026-09-27: [IBM Bob](https://bob.ibm.com/docs/ide/features/skills), [Claude Code](https://code.claude.com/docs/en/skills).
