# Submission field copy

These fields describe the actual project. The original example source and conversation screenshots are included. Before final submission, add required Bob task summaries and record the demo video. Do not treat this document as proof of completed submission.

## Submission Title

IntentConfirm: Clarify Before You Build

## Short Description

IntentConfirm is an open-source Skill that turns vague requests into concrete choices, preserves user constraints, and helps the same AI assistant build from an agreed brief. It uses the host model and was exercised in IBM Bob.

## Long Description

AI coding assistants can produce working software that misses the user's intended outcome. Short requests often omit choices that change the data model, workflow or scope. Users may not know how to write a detailed specification, and repeated free-text questioning adds friction.

IntentConfirm is a portable Skill for clarifying requirements inside the user's existing AI conversation. It preserves explicit constraints, separates facts from assumptions, and asks one to three consequential questions per round with concrete options and free-text alternatives. It treats delegated choices as visible defaults. Once enough information is available, the host assistant continues the authorized implementation. Clear requests can proceed without extra questioning.

For longer tasks, optional Python tools preserve evidence, validate structured requirement records and invalidate affected decisions after a change. Unrelated constraints remain intact. Structural checks do not prove semantic correctness or replace user judgment.

The initial target users are people building software with AI coding assistants. In a real IBM Bob session, the user asked for a personal study tracker and answered BAA and C to select reading progress, browser storage, a single HTML file and delegated completion behavior. Bob summarized the brief and reported implementing the example. The user opened it and reported that it met their expectations.

The reviewed Skill passed 38 Python tests, with 47 separate tests for the retained web prototype. This is one real use case, not a controlled productivity benchmark. The intended benefit is less rework caused by hidden assumptions. Broader host compatibility and average time savings remain to be evaluated.

IntentConfirm uses the host model without requiring a separate API key or platform. The source uses the MIT license.

## IBM Bob Usage Statement

IBM Bob IDE contributed to both development and real use of IntentConfirm. In the first development task, Bob upgraded the web prototype's clarification engine, including evidence candidates, context-sensitive questions and dependency behavior. In the Skill development task, Bob implemented the requirement update tool and added tests for dependency invalidation. We preserve Bob's original completion records in the repository.

For the real-use case, the participant asked Bob to use IntentConfirm to build a personal study tracker. Bob presented concrete choices, retained the user's answers, stated a delegated default and summarized the requirements before reporting implementation in examples/study-log-demo/. The participant opened the result and confirmed that it matched their expectations.

Codex created the initial prototype and Skill package, then independently reviewed and repaired edge cases in Bob's update tool. The project documents distinguish these contributions rather than attributing all work to Bob. The final reviewed Skill passed 38 Python tests. We did not use watsonx.ai or watsonx Orchestrate. A separate optional web prototype contains a DeepSeek adapter, but the primary Skill relies on the host model.

## Categories and technologies

Select the closest labels that actually appear in the form. Suitable concepts are Developer Tools, Productivity and AI Agents. Technologies actually used include IBM Bob, Python, JavaScript, HTML and CSS. Node.js belongs to the optional web prototype. Do not select watsonx products as used.

## URLs and files

Repository URL: https://github.com/pruettlazaro143-a11y/intentconfirm

Presentation PDF: docs/presentation/IntentConfirm_Pitch_v1.pdf.

Video: still to be recorded. The prepared bilingual script is in docs/presentation/IntentConfirm_Speaker_Guide.md. The public prototype/experience field must match the actual available installation or demo URL; do not supply localhost or invent a hosted deployment.

## Evidence

Real conversation: docs/REAL_BOB_SESSION.md. Bob development reports: docs/BOB_COMPLETION.md and docs/BOB_SKILL_COMPLETION.md. Later corrections: docs/CODEX_SKILL_REVIEW.md. Required screenshots: bob_sessions/ (awaiting original task summaries).
