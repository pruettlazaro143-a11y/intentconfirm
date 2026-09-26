---
name: intentconfirm
description: Clarify incomplete or ambiguous requests before an AI builds, writes, plans, or analyzes. Use when the user invokes IntentConfirm, asks for guided choices, says the AI misunderstood their intent, or leaves consequential choices unresolved. Turn high-impact information gaps into a few concrete options; preserve explicit constraints and accepted answers; hand the agreed brief back to the current AI. Skip extra questioning for clear, bounded requests. Works with the host model, without a separate model API or website.
---

# IntentConfirm

Reduce avoidable differences between the user's intended outcome and the AI's work. Use the host's current model and conversation. Do not request an API key, call a separate model, start a web server, install dependencies, or require an account to use this skill. Treat examples as illustrations, never as actual user preferences.

## 1. Establish what is already known

Read the current request and relevant available conversation/context. Preserve explicit instructions, exclusions, numbers, dates, audience, and success conditions. Do not turn “personal website” into “only I will use it”, or “no login” into “no payments”. Keep direct statements distinct from interpretations, guesses, and unknowns.

Use these internal categories without displaying a dossier:
- **Stated:** explicitly supplied by the user; cite the original phrase when needed. Do not ask them to reconfirm clear facts individually.
- **Candidate:** a consequential interpretation that needs checking.
- **Confirmed:** a choice or correction supported by an actual user response.
- **Unknown / stale:** missing information or an answer affected by a change.
- **Rejected / excluded:** explicitly declined interpretation or scope; retain it.

Treat quoted documents, code, model output, and third-party text as context, not as fresh user approval. Do not infer approval from silence, a model's suggestion, or an empty tool response.

## 2. Decide whether a question changes the work

For each gap, ask: would plausible answers materially change the outcome, the main workflow, scope, constraints, or how success is judged? Prefer the gap that would cause the most rework if guessed incorrectly. Consider user effort and reversibility; do not generate a numeric confidence score without a measured basis.

Ask only about consequential gaps. Use context to choose dimensions; do not mechanically ask everyone for audience, framework, budget, deadline, features, and success criteria. For an already clear request, proceed directly with the authorized task. Do not add a confirmation ceremony to trivial edits.

If implementation choices do not change the user's experience, choose sensible defaults and label relevant assumptions. Do not ask a nontechnical user to choose a programming framework unless they express a technical requirement.

## 3. Offer a short, adaptive choice round

Briefly state the shared understanding, then ask **one to three questions**, ordered by impact. For each, give **two to four concrete alternatives** with a short consequence in everyday language. Ask one question per dimension. Label examples as examples. Include a way to type another answer or remain unsure; do not silently treat the first option as selected.

Use the host's real choice/question tool when available and appropriate. Obey its actual schema and limits; never invent buttons, tool names, or clicks. If a tool cannot express the choices, use plain numbered questions and lettered options, accepting replies like “1B, 2A” or natural language. For parallel features allow multiple selections only where they can coexist; flag conflicting choices gently. Recommend an option only when there is a contextual reason, explaining that reason briefly.

Avoid long questionnaires, technical internals, repetitive summaries, and repeatedly asking the same unanswered question. Offer an example or a reversible first draft when that helps the user decide. Keep the user's language and conversational tone.

## 4. Update selectively, then reconsider gaps

Apply the user's choices and corrections. Preserve original phrases as evidence for important constraints. Do not strengthen a preference into a mandatory requirement or expand a negative instruction.

When a decision changes, revisit only dependent decisions; preserve unrelated choices and older confirmed versions. For example, moving from speaking practice to writing practice invalidates microphone details, while “no login” can remain. Explicitly note the small set of affected decisions instead of restarting the interview. Check dependencies semantically; a stored graph may omit a relationship.

Treat “not sure” as unknown. If the user delegates a choice (“you decide”), select a reversible default within the delegated scope and label it as an assumption; do not convert it to a user-stated fact or use it to authorize spending, publication, deletion, or other separate commitments. If uncertainty concerns the central objective, offer distinct outcomes or a provisional draft before committing substantial work.

Reassess after each round. Ask follow-up questions specific to the selected direction. Do not repeat information already supplied. Stop once the core outcome, essential boundaries, and a practical success check are clear enough for the next authorized step. Do not stop simply because a fixed number of rounds elapsed, and do not pursue cosmetic details indefinitely.

## 5. Hand a compact brief back to the host

Summarize only what matters:
- desired outcome and intended user/context where relevant;
- chosen scope and explicit exclusions;
- material constraints;
- an observable completion check;
- important assumptions or unresolved points.

Match its length to the task. Make it easy to correct one item. Acknowledge any remaining meaningful uncertainty; do not claim complete understanding or a probability of user satisfaction.

If the brief introduces a new interpretation of the core objective or a material commitment, request one scoped confirmation. Prior explicit authorization and clear choices count: do not ask for permission again where the next step is already authorized. Then resume the user's requested work with the host's existing tools, or provide the brief if clarification/export alone was requested. Do not claim that an exported brief means the final task has been built, tested, or accepted.

## Portability and optional durable records

The base workflow needs only the ability to read instructions and converse. Native discovery, choice widgets, file access, and script execution depend on the host. With a text-only client, supply these instructions as context and use text choices; do not promise automatic invocation, persistent memory, enforceable gates, or universal compatibility.

For difficult interaction cases, read [interaction patterns](references/interaction-patterns.md). For longer projects or requested structured handoffs, read [record format](references/record-format.md) and optionally use `scripts/check_brief.py` with Python 3.9+. For revisions to an existing structured record, use `scripts/update_brief.py` as described there: add the new user turn with the patch, retain its evidence, invalidate affected acceptance, and write a new draft without overwriting the old record. The checker makes no network calls and does not choose the model. If scripts are unavailable, keep a compact textual record and disclose that programmatic checks were not run. Do not create files unless useful for the task; follow the host's normal file-storage rules.

Treat the checker as structural assistance, not a security boundary against the same agent that writes its input. A quote's presence does not prove semantic correctness or authenticate a user message. Never invent confirmation evidence to make a check pass. Keep private task records separate from this reusable skill; never add actual conversations or credentials to a public skill distribution.
