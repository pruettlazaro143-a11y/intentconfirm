# IntentConfirm

Clarify incomplete requests before an AI starts building.

IntentConfirm is an MIT-licensed Skill that runs inside an AI assistant's existing conversation. It turns consequential information gaps into a few concrete choices, preserves the user's constraints, and hands the agreed brief back to the same assistant for execution. It uses the host model and needs no separate model API key or service.

![IntentConfirm overview](docs/presentation/images/slide-01.png)

## A real example in IBM Bob

A user asked for a personal study tracker. Bob asked about content, storage and interface. The user replied **BAA**, selecting reading progress, browser localStorage and a single HTML file. A follow-up answer, **C**, delegated how to handle completed items. Bob stated its default, summarized the brief and reported building the example. The user opened it and said it met their expectations.

[Read the supplied conversation](docs/REAL_BOB_SESSION.md) or [view the presentation](docs/presentation/IntentConfirm_Pitch_v1.pdf).

This is one real user case, not a controlled benchmark. The participant-supplied original is included at [examples/study-log-demo/index.html](examples/study-log-demo/index.html); download and open it locally. [Original conversation screenshots](bob_sessions/README.md) include the explicit Skill activation. The conversation record distinguishes Bob's report from user feedback.

## Use in IBM Bob

1. Open this whole repository as a Bob workspace. The project Skill is already in `.bob/skills/intentconfirm/`.
2. Check **Bob Settings → Skills** for `intentconfirm`.
3. Start a new conversation and ask Bob to use IntentConfirm with your task.

> Use IntentConfirm to help me build a personal study tracker. Clarify the choices that affect the result, then implement the first version in examples/study-log-demo/. Keep the main project unchanged.

For another Bob project, copy the `intentconfirm` directory into that project's `.bob/skills/` directory. Start a new conversation after changing a Skill.

## Other AI assistants

The package follows the `SKILL.md` format. Use your host's documented Skill location, or provide the instructions as conversation context if it cannot discover Skills. Native choices, scripts and persistent records depend on the host. Text choices need no special UI. Broad compatibility has not yet been independently tested.

The base Skill uses the host model. The optional web prototype has a separate, opt-in DeepSeek integration and is not required for Skill use.

## How it works

- Keep explicit requirements separate from assumptions and unknowns.
- Ask one to three questions about choices that materially change the work.
- Allow free text, uncertainty and scoped delegation to the assistant.
- Revisit affected decisions after a change, preserving unrelated constraints.
- Summarize the brief and continue the authorized task. Clear requests can proceed directly.

Optional Python tools support longer records:

| Tool | Purpose |
| --- | --- |
| `check_brief.py` | Check structure, quotes, dependencies and approval consistency |
| `update_brief.py` | Apply evidenced updates, clear affected acceptance and write a new draft without overwriting its source |

See [record format and commands](.bob/skills/intentconfirm/references/record-format.md). Checks cannot prove semantic correctness, completeness or user identity. A matching quote does not prove that an interpretation is correct.

## Validation

```sh
python3 -m unittest discover -s .bob/skills/intentconfirm/scripts -p 'test_*.py'
npm test
```

The reviewed Skill passed **38 Python tests**. The retained web prototype passed **47 Node tests**. The real Bob conversation is separate evidence. No measured percentage reduction in rework or development time is claimed.

Python tools require Python 3.9+. Node 18+ is only needed for the optional web prototype and its tests. The base Skill conversation requires neither runtime.

## Optional web prototype

Open `index.html` for the limited local rules demonstration. See [web demo](docs/WEB_DEMO.md) for the optional server and model integration. The rules are not general language understanding. The local model server is not a public multi-user service.

## IBM Bob contribution

Bob worked on the clarification engine and the requirement update tool with tests. It also hosted the real clarification-to-build session. Codex created the initial prototype and Skill package, then reviewed and repaired edge cases. Original reports and later reviews remain separate.

- [Bob engine record](docs/BOB_COMPLETION.md)
- [Bob Skill development record](docs/BOB_SKILL_COMPLETION.md)
- [Codex review and fixes](docs/CODEX_SKILL_REVIEW.md)
- [Real use case](docs/REAL_BOB_SESSION.md)
- [Task summary evidence status](bob_sessions/README.md)

Required task consumption summaries still need to be supplied. Context-size and account-budget screenshots do not replace them. A repository release does not mean the hackathon submission is complete.

## Sharing and contributions

`npm run pack` creates a share archive, including `examples/` when present and excluding credentials and caches. Do not commit `.env`, private requirement records or API keys. Use clearly labeled synthetic data for tests.

[Chinese setup notes](docs/README.zh-CN.md) · [MIT license](LICENSE)
