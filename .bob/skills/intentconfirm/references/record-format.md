# Optional local brief records

Contents: [Shape](#shape) · [Run](#run) · [Approval and versions](#whole-brief-approval-and-versions) · [Updates](#applying-updates-with-update_briefpy)

Use for durable, structured handoffs only; ordinary conversations do not need a JSON transcript. Keep task records in the user's chosen project/output location, outside the reusable skill. The optional checker uses Python 3.9+ standard library, reads one local JSON file, and never edits it or contacts a model.

## Shape

```json
{
  "schema_version": 1,
  "sources": [{"id":"u1","role":"user","text":"给自己用，不要登录"}],
  "items": [
    {"id":"audience","label":"受众","value":"自己使用","kind":"requirement","status":"stated","critical":true,"depends_on":[],"evidence":[{"source":"u1","quote":"给自己用"}]},
    {"id":"no_login","label":"排除项","value":"不要登录","kind":"exclusion","status":"stated","critical":true,"depends_on":[],"evidence":[{"source":"u1","quote":"不要登录"}]},
    {"id":"goal","label":"主要目标","value":"尚未明确","kind":"requirement","status":"unknown","critical":true,"depends_on":[],"evidence":[]}
  ]
}
```

This is a synthetic shape example, not an approved user brief.

- `sources`: actual available turns/excerpts. Roles: user, assistant, context. Never relabel model or third-party text as user.
- `items`: stable IDs; preserve rejected/excluded records instead of erasing corrections. `kind`: requirement, exclusion, assumption. `status`: stated, candidate, confirmed, unknown, stale, rejected, excluded.
- `stated`: explicit unambiguous user requirement; at least one user quotation is mandatory. No separate confirmation needed to record it.
- `confirmed`: a user response supports adopting a candidate. Add `confirmation: {source, quote}` pointing to a real user response. Interpret it in conversational context, not by matching words like “OK”.
- `assumption`: an agent-selected default, retained as candidate until expressly adopted; set critical false only if it is reversible and within the user's delegated scope.
- `critical`: whether unresolved interpretation blocks the planned next step. Do not flip to false to silence a warning. Scope needs human/model judgment.
- `depends_on`: other item IDs. No missing references or cycles. When changing an item, mark affected accepted dependents stale; the checker also flags active items with unresolved dependencies.
- `rejected` is a declined interpretation. `excluded` retires an item that is no longer in scope. A confirmed no-login condition is instead `kind: exclusion, status: stated/confirmed` and remains an active constraint.

## Run

From the skill directory (or substitute the script's actual absolute path):

```sh
python3 scripts/check_brief.py /path/to/brief.json
python3 scripts/check_brief.py /path/to/brief.json --digest
```

Default output reports structural validity, blocking items, unresolved items, active scope IDs, and whether recorded whole-brief approval matches the current content. Exit 0 means structural validity only, even if clarification remains; exit 2 means a malformed record. Neither permits external actions or proves semantic completeness.

## Whole-brief approval and versions

Whole-brief approval is optional; use it only if the interaction actually called for one. Keep execution authorization separate and obey the host's policies. To record an actual user acceptance after showing the brief:

1. Compute the digest of the items and evidence sources with `--digest`.
2. Add the real user acceptance as a new source, preserving its context.
3. Add `approval: {"source":"u2","quote":"就按这份来","digest":"<computed digest>"}`.
4. Run the checker. Changes to items or their evidence invalidate the approval digest; merely appending the approval source does not.

The script cannot authenticate that the recorded source really came from a user. It never generates confirmation text. A current digest is not proof the user read or understood the entire record. Never fabricate the approval source.

For history, save an approved record as a new version before changing the working draft. Never overwrite a past approved snapshot. Reject contradictions and stale dependencies even when the digest matches. Preserve only needed excerpts; do not copy unrelated private history.

## Applying updates with `update_brief.py`

Use the optional update tool when a user-evidenced change needs to be applied and its downstream effects propagated in one step. It requires Python 3.9+ and has no third-party dependencies.

```sh
python3 scripts/update_brief.py old_draft.json patches.json new_draft.json
# or pass the patch array inline:
python3 scripts/update_brief.py old_draft.json '[{"id":"goal","field":"value","new_value":"展示作品或业务","evidence":{"source":"u3","quote":"改成作文练习"}}]' new_draft.json
```

Each patch object must include:

- `id`: the item to change (must exist in the record).
- `field`: one of `value`, `label`, `status`, `critical`, `kind`.
- `new_value`: the replacement value.
- `evidence`: `{"source": "<sid>", "quote": "<exact text>"}` — the source must already exist in the record, must have `role: "user"`, and the quote must appear verbatim in that source's text.

The tool:
1. Validates all patches before touching any data (atomic failure).
2. Applies changes to the directly named items.
3. Propagates `stale` status to all active items that transitively depend on changed items; removes their `confirmation` field (it is no longer current).
4. Removes any whole-brief `approval` from the draft (the new draft has not been re-approved).
5. Validates the output with `check_brief.py`'s `inspect()` before writing.
6. Never modifies the input file; refuses to write output over the input path; refuses to overwrite an existing output file unless `--force` is given.

The tool cannot authenticate who sent the evidence, prove semantic correctness, or select a replacement value on behalf of the user. Invalid dependency references, dependency cycles, or missing patch evidence cause exit code 2 without writing output.

Exit 0 prints a JSON summary of stale-propagated IDs and confirms `approval_cleared: true`. Exit 2 prints `{"updated": false, "error": "..."}`.

## Applying updates with update_brief.py

Run the optional offline updater when a user changes a recorded decision:

```sh
python3 scripts/update_brief.py old_brief.json changes.json new_brief.json
```

Use a new output filename each time. There is no overwrite/force mode. Existing files, symlinks and hardlink aliases are refused. Preserve approved versions; do not edit them first just to insert new conversation turns.

Supply a JSON object to add the new user turn and its changes together:

```json
{
  "sources": [{"id":"u3","role":"user","text":"改成作文练习"}],
  "patches": [{"id":"goal","field":"value","new_value":"作文练习",
    "evidence":{"source":"u3","quote":"改成作文练习"}}]
}
```

This is a synthetic format example, not user authorization. Each new source needs a unique ID; existing sources cannot be rewritten. A bare patch array remains supported when its evidence sources already exist. Each patch cites a user source with an exact quote. This only validates quotation existence, not the semantic inference or who actually spoke.

The updater validates the old record before any processing and the complete new draft before writing. Patch fields: value, label, kind, critical, status. It rejects duplicate patches to the same item/field, even if identical, and refuses status changes to stated/confirmed. Never fabricate evidence to pass validation.

A semantic edit makes the changed item a candidate and removes old confirmation; explicitly requested unknown/stale/rejected/excluded status remains unaccepted. New patch evidence replaces current evidence, while previous item versions and actual patches are kept in change_log. User sources remain available. Active downstream dependencies become stale transitively, including across batches. Unchanged and unrelated items are preserved. Actual changes clear whole-brief approval; an empty or no-op batch preserves the original record and approval exactly.

Use a later actual user response to adopt the revised candidate in the host's normal record workflow, then run check_brief.py. The update tool itself does not auto-approve or authenticate that response. A reviewed brief can still contain semantic omissions; this is not an independent permission gate.

Exit 0 means a new output file was written; exit 2 means failure. The CLI reports updated, stale_items, and whether an existing approval was cleared. Input/changes/output are limited to 2 MB. New output files are private by default. File writes may fail for ordinary filesystem reasons; success must be read from the result, not assumed.
