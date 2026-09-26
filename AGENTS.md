# Project instructions

Read README.md and docs/PRODUCT.md before changing code. This is a general intent-clarification product; IELTS is only a sample.

Primary deliverable: the portable intentconfirm Skill in .bob/skills/intentconfirm, using the host model. Read docs/BOB_TASK_02_SKILL.md for the current Bob task. This changes the prior platform-first positioning. Skill usage does not require API keys or a server. The optional checker is structural assistance, not an independent authorization boundary.

Preserved web demo has two engines: local deterministic rules and opt-in DeepSeek via a loopback Node server. Never imply a real model was called when only mocks were tested. Never send, log, expose, or package .env credentials. Preserve no-dependency runtime and direct-file offline mode.

Model candidates are not user consent. Exact quotation checks do not prove semantic correctness. Unknown answers cannot count as consent. Changed answers require a fresh model assessment; declared downstream dependencies become stale. Preserve immutable confirmation snapshots and rejected/excluded records. Model output cannot silently rewrite existing question definitions.

Run npm test for states/transport. Optional npm run test:browser and npm run test:ai-browser require Playwright/Chromium; the latter uses fixture responses, not DeepSeek. Record actual work only. Do not invent Bob contributions, screenshots, effectiveness metrics, live API success, or submission status.

Bob's original core task and report are historical records. DeepSeek integration and later Codex fixes must be credited separately. Use npm run pack for sharing; it excludes .env.
