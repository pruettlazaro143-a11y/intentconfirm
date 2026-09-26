#!/usr/bin/env python3
"""Offline draft update: preserve evidence, invalidate acceptance, never overwrite files.

CLI: update_brief.py old.json changes.json new.json
Changes: a patch list, or {"sources": [...new user turns...], "patches": [...]}.
No model, network or semantic-consent verification. Exit 0 on success; 2 on failure.
"""
import argparse
import copy
import json
import os
import sys
from pathlib import Path

from check_brief import inspect as _inspect, require, text, ACTIVE, ID, STATUSES

_PATCHABLE_FIELDS = {"value", "label", "status", "critical", "kind"}
MAX_BYTES = 2_000_000


def _validate_patch_entry(entry, source_map):
    require(isinstance(entry, dict), "each patch entry must be an object")
    iid, field = entry.get("id"), entry.get("field")
    require(isinstance(iid, str) and ID.fullmatch(iid), "invalid patch item id")
    require(isinstance(field, str) and field in _PATCHABLE_FIELDS, "invalid patch field")
    require("new_value" in entry, "missing new_value")
    v = entry["new_value"]
    if field in {"value", "label"}:
        require(text(v), "value/label must be nonempty text")
    elif field == "critical":
        require(type(v) is bool, "critical must be boolean")
    elif field == "kind":
        require(isinstance(v, str) and v in {"requirement", "exclusion", "assumption"}, "invalid kind")
    else:
        require(isinstance(v, str) and v in STATUSES - ACTIVE,
                "update tool cannot set stated/confirmed; record genuine adoption separately")
    ev = entry.get("evidence")
    require(isinstance(ev, dict), "patch evidence must be an object")
    sid, quote = ev.get("source"), ev.get("quote")
    require(isinstance(sid, str) and sid in source_map, "patch source missing; provide new user turns in sources")
    require(source_map[sid]["role"] == "user", "patch source must be a user turn")
    require(text(quote) and quote in source_map[sid]["text"], "patch quote does not exist in user source")


def _descendants(roots, item_map):
    children = {iid: [] for iid in item_map}
    for iid, item in item_map.items():
        for dep in item["depends_on"]:
            children[dep].append(iid)
    # Separate traversed nodes from found descendants: a node may be both a
    # batch-change root and another root's descendant.
    pending, traversed, found = list(roots), set(), set()
    while pending:
        current = pending.pop()
        if current in traversed:
            continue
        traversed.add(current)
        for child in children[current]:
            found.add(child)
            pending.append(child)
    return found


def apply_patches(record, patches, new_sources=None):
    """Return a validated copy; every semantic edit needs new review, never old consent."""
    parent = _inspect(record)  # Reject invalid input before permitting any repairs.
    require(isinstance(patches, list) and len(patches) <= 200, "patches must be an array, max 200")
    new_sources = [] if new_sources is None else new_sources
    require(isinstance(new_sources, list) and len(new_sources) <= 100, "sources must be an array, max 100")
    draft = copy.deepcopy(record)
    source_map = {s["id"]: s for s in draft["sources"]}
    for source in new_sources:
        require(isinstance(source, dict), "new source must be an object")
        sid = source.get("id")
        require(isinstance(sid, str) and ID.fullmatch(sid) and sid not in source_map,
                "new source id must be unique; old sources cannot be rewritten")
        require(source.get("role") == "user" and text(source.get("text")), "new sources must be user turns with text")
        source_map[sid] = copy.deepcopy(source)
        draft["sources"].append(copy.deepcopy(source))
    _inspect(draft)
    item_map = {i["id"]: i for i in draft["items"]}
    seen, effective = set(), []
    for entry in patches:
        _validate_patch_entry(entry, source_map)
        require(entry["id"] in item_map, "patch targets unknown item")
        key = (entry["id"], entry["field"])
        require(key not in seen, "duplicate patches for the same item field")
        seen.add(key)
        if item_map[entry["id"]][entry["field"]] != entry["new_value"]:
            effective.append(entry)
    if not effective:
        return copy.deepcopy(record)  # Preserve current approval for a true no-op.
    changes = draft.get("change_log", [])
    require(isinstance(changes, list), "change_log must be an array")
    grouped = {}
    for entry in effective:
        grouped.setdefault(entry["id"], []).append(entry)
    before = {iid: copy.deepcopy(item_map[iid]) for iid in grouped}
    for iid, entries in grouped.items():
        item, new_evidence = item_map[iid], []
        for entry in entries:
            item[entry["field"]] = copy.deepcopy(entry["new_value"])
            ev = {"source": entry["evidence"]["source"], "quote": entry["evidence"]["quote"]}
            if ev not in new_evidence:
                new_evidence.append(ev)
        # An edit invalidates old consent even if the old item was ACTIVE.
        if not any(e["field"] == "status" for e in entries):
            item["status"] = "candidate"
        item.pop("confirmation", None)
        item["evidence"] = new_evidence
    descendants = _descendants(set(grouped), item_map)
    invalidated = []
    for iid in sorted(descendants):
        item = item_map[iid]
        if item["status"] in ACTIVE:
            before.setdefault(iid, copy.deepcopy(item))
            item["status"] = "stale"
            item.pop("confirmation", None)
            invalidated.append(iid)
    draft.pop("approval", None)
    draft["change_log"] = changes + [{"parent_digest": parent["digest"],
        "patches": copy.deepcopy(effective), "previous_items": before,
        "new_source_ids": [s["id"] for s in new_sources], "invalidated": invalidated}]
    _inspect(draft)
    require(len(json.dumps(draft, ensure_ascii=False).encode("utf-8")) <= MAX_BYTES, "updated record exceeds 2 MB")
    return draft


def _read_json(path):
    with Path(path).open("rb") as f:
        raw = f.read(MAX_BYTES + 1)
    require(len(raw) <= MAX_BYTES, "JSON input exceeds 2 MB")
    return json.loads(raw)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("record", help="Read-only JSON brief")
    parser.add_argument("patches", help="Changes JSON file or inline JSON")
    parser.add_argument("output", help="New output file; must not already exist")
    args = parser.parse_args()
    try:
        record_path, out_path = Path(args.record), Path(args.output)
        require(out_path.resolve() != record_path.resolve(), "output must differ from input")
        record = _read_json(record_path)
        arg = args.patches.strip()
        if arg.startswith(("[", "{")):
            require(len(arg.encode("utf-8")) <= MAX_BYTES, "changes exceed 2 MB")
            changes = json.loads(arg)
        else:
            changes = _read_json(arg)
        if isinstance(changes, dict):
            require(set(changes) <= {"sources", "patches"}, "unknown changes field")
            patches, sources = changes.get("patches"), changes.get("sources", [])
        else:
            patches, sources = changes, []
        draft = apply_patches(record, patches, sources)
        encoded = json.dumps(draft, ensure_ascii=False, indent=2)
        require(len(encoded.encode("utf-8")) <= MAX_BYTES, "updated record exceeds 2 MB")
        # O_EXCL atomically refuses existing paths, symlinks and hardlink aliases;
        # no --force option can destroy prior input or snapshots.
        fd = os.open(out_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(encoded)
        print(json.dumps({"updated": draft != record, "output": str(out_path),
            "stale_items": [i["id"] for i in draft["items"] if i["status"] == "stale"],
            "approval_cleared": "approval" in record and "approval" not in draft}, ensure_ascii=False))
        return 0
    except (ValueError, OSError, TypeError, KeyError, AttributeError, RecursionError) as exc:
        print(json.dumps({"updated": False, "error": str(exc)}, ensure_ascii=False))
        return 2


if __name__ == "__main__":
    sys.exit(main())
