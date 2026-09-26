#!/usr/bin/env python3
"""Optional offline structure checker, not a semantic or authorization verifier."""
import argparse
import hashlib
import json
import re
import sys

ACTIVE = {"stated", "confirmed"}
UNRESOLVED = {"candidate", "unknown", "stale"}
STATUSES = ACTIVE | UNRESOLVED | {"rejected", "excluded"}
ID = re.compile(r"^[a-zA-Z][a-zA-Z0-9_-]{0,63}$")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def text(value):
    return isinstance(value, str) and bool(value.strip())


def inspect(data):
    require(isinstance(data, dict) and data.get("schema_version") == 1, "schema_version must be 1")
    sources, items = data.get("sources"), data.get("items")
    require(isinstance(sources, list) and len(sources) <= 500, "sources must be an array, max 500")
    require(isinstance(items, list) and 0 < len(items) <= 100, "items must be a nonempty array, max 100")
    source_map, item_map = {}, {}
    for source in sources:
        require(isinstance(source, dict), "source must be an object")
        sid = source.get("id")
        require(isinstance(sid, str) and ID.fullmatch(sid) and sid not in source_map, "invalid or duplicate source id")
        require(source.get("role") in {"user", "assistant", "context"} and text(source.get("text")), "source role/text invalid")
        source_map[sid] = source

    def quotation(q, user_only=False):
        require(isinstance(q, dict), "quotation must be an object")
        sid, quote = q.get("source"), q.get("quote")
        require(isinstance(sid, str) and sid in source_map and text(quote), "quotation source/text missing")
        require(quote in source_map[sid]["text"], "quotation does not exist in source")
        require(not user_only or source_map[sid]["role"] == "user", "consent or stated facts require a user source")
        return sid

    used_sources = set()
    for item in items:
        require(isinstance(item, dict), "item must be an object")
        iid = item.get("id")
        require(isinstance(iid, str) and ID.fullmatch(iid) and iid not in item_map, "invalid or duplicate item id")
        require(text(item.get("label")) and text(item.get("value")), "item label/value missing")
        require(item.get("kind") in {"requirement", "exclusion", "assumption"}, "invalid kind")
        status = item.get("status")
        require(status in STATUSES, "invalid status")
        require(type(item.get("critical")) is bool, "critical must be boolean")
        deps, evidence = item.get("depends_on"), item.get("evidence")
        require(isinstance(deps, list) and all(isinstance(d, str) for d in deps) and len(deps) == len(set(deps)), "invalid dependencies")
        require(isinstance(evidence, list), "evidence must be an array")
        for q in evidence:
            used_sources.add(quotation(q))
        if status == "stated":
            require(item["kind"] != "assumption", "an assumption cannot be user-stated")
            require(any(source_map[q["source"]]["role"] == "user" for q in evidence), "stated item needs user evidence")
        if status == "confirmed":
            used_sources.add(quotation(item.get("confirmation"), user_only=True))
        item_map[iid] = item
    for item in items:
        require(all(d in item_map and d != item["id"] for d in item["depends_on"]), "missing or self dependency")
    visited, visiting = set(), set()

    def visit(iid):
        require(iid not in visiting, "dependency cycle")
        if iid in visited:
            return
        visiting.add(iid)
        for dep in item_map[iid]["depends_on"]:
            visit(dep)
        visiting.remove(iid)
        visited.add(iid)

    for iid in item_map:
        visit(iid)
    canonical = {"items": sorted(items, key=lambda i: i["id"]), "sources": [source_map[s] for s in sorted(used_sources)]}
    digest = hashlib.sha256(json.dumps(canonical, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")).hexdigest()
    unresolved = [i["id"] for i in items if i["status"] in UNRESOLVED]
    blocked = {i["id"] for i in items if i["critical"] and i["status"] in UNRESOLVED}
    dependency_conflicts = []
    for item in items:
        if item["status"] not in ACTIVE:
            continue
        for dep in item["depends_on"]:
            if item_map[dep]["status"] not in ACTIVE:
                dependency_conflicts.append({"item": item["id"], "dependency": dep})
                blocked.add(item["id"])
    approval = data.get("approval")
    approval_current = False
    if approval is not None:
        quotation(approval, user_only=True)
        require(isinstance(approval.get("digest"), str) and re.fullmatch(r"[a-f0-9]{64}", approval["digest"]), "invalid approval digest")
        approval_current = approval["digest"] == digest
    return {"structurally_valid": True, "digest": digest, "blocking_items": sorted(blocked),
            "unresolved_items": unresolved, "dependency_conflicts": dependency_conflicts,
            "active_scope_ids": [i["id"] for i in items if i["status"] in ACTIVE],
            "recorded_approval_current": approval_current,
            "confirmed_record_consistent": approval_current and not blocked,
            "limits": "Checks recorded structure and exact quotations only; does not authenticate user messages, prove semantic completeness, or authorize execution."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("record", help="Local JSON brief path")
    parser.add_argument("--digest", action="store_true", help="Print only current content digest")
    args = parser.parse_args()
    try:
        with open(args.record, "rb") as f:
            raw = f.read(2_000_001)
        require(len(raw) <= 2_000_000, "record exceeds 2 MB")
        report = inspect(json.loads(raw))
        print(report["digest"] if args.digest else json.dumps(report, ensure_ascii=False, indent=2))
        return 0
    except (ValueError, OSError, TypeError, KeyError, RecursionError) as exc:
        print(json.dumps({"structurally_valid": False, "error": str(exc)}, ensure_ascii=False))
        return 2


if __name__ == "__main__":
    sys.exit(main())
