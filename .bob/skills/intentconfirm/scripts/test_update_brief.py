"""Tests for update_brief.py.  Synthetic fixtures only — no host-model calls.

Each test actually invokes apply_patches() (or the CLI) so stale propagation is
performed by the tool under test, not pre-fabricated in the fixture data.
"""
import copy
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

# Make the scripts directory importable regardless of working directory.
_SCRIPTS = pathlib.Path(__file__).parent
sys.path.insert(0, str(_SCRIPTS))
from check_brief import inspect as check_inspect  # noqa: E402
from update_brief import apply_patches  # noqa: E402


# ---------------------------------------------------------------------------
# Shared fixture builder
# ---------------------------------------------------------------------------
# Dependency chain: goal (A) → detail (B) → success (C)
# Unrelated items: audience (no deps), no_login (no deps, kind=exclusion)
# All three chain items are "confirmed" initially.
# ---------------------------------------------------------------------------

def chain_record():
    """Return a well-formed record with a three-level dependency chain A→B→C
    plus two unrelated confirmed items (audience, no_login)."""
    return {
        "schema_version": 1,
        "sources": [
            {"id": "u1", "role": "user",
             "text": "给自己用，不要登录，主要目标是学习练习，细节是口语反馈，验收是能独立使用"},
            {"id": "u2", "role": "user", "text": "就按这份来"},
            {"id": "u3", "role": "user", "text": "改成作文练习"},
        ],
        "items": [
            # A — goal (root of chain)
            {"id": "goal", "label": "主要目标", "value": "学习与练习",
             "kind": "requirement", "status": "confirmed", "critical": True,
             "depends_on": [],
             "evidence": [{"source": "u1", "quote": "主要目标是学习练习"}],
             "confirmation": {"source": "u1", "quote": "主要目标是学习练习"}},
            # B — detail (depends on A)
            {"id": "detail", "label": "细节", "value": "口语练习与反馈",
             "kind": "requirement", "status": "confirmed", "critical": True,
             "depends_on": ["goal"],
             "evidence": [{"source": "u1", "quote": "细节是口语反馈"}],
             "confirmation": {"source": "u1", "quote": "细节是口语反馈"}},
            # C — success (depends on B)
            {"id": "success", "label": "验收", "value": "用户能独立完成核心操作",
             "kind": "requirement", "status": "confirmed", "critical": True,
             "depends_on": ["detail"],
             "evidence": [{"source": "u1", "quote": "验收是能独立使用"}],
             "confirmation": {"source": "u1", "quote": "验收是能独立使用"}},
            # Unrelated — audience
            {"id": "audience", "label": "受众", "value": "自己",
             "kind": "requirement", "status": "confirmed", "critical": True,
             "depends_on": [],
             "evidence": [{"source": "u1", "quote": "给自己用"}],
             "confirmation": {"source": "u1", "quote": "给自己用"}},
            # Unrelated — no_login (exclusion)
            {"id": "no_login", "label": "排除登录", "value": "不要登录",
             "kind": "exclusion", "status": "confirmed", "critical": True,
             "depends_on": [],
             "evidence": [{"source": "u1", "quote": "不要登录"}],
             "confirmation": {"source": "u1", "quote": "不要登录"}},
        ],
    }


def with_approval(record):
    """Add a whole-brief approval whose digest matches the current record, return copy."""
    d = copy.deepcopy(record)
    d["approval"] = {
        "source": "u2",
        "quote": "就按这份来",
        "digest": check_inspect(d)["digest"],
    }
    return d


class TestUpdateBrief(unittest.TestCase):

    # ------------------------------------------------------------------
    # 1. A→B→C transitive stale propagation
    # ------------------------------------------------------------------
    def test_changing_A_marks_B_and_C_stale_not_unrelated(self):
        """Changing goal (A) must mark detail (B) and success (C) stale.
        audience and no_login must remain confirmed and unchanged."""
        record = chain_record()
        patch = [{"id": "goal", "field": "value", "new_value": "作文练习",
                  "evidence": {"source": "u3", "quote": "改成作文练习"}}]

        draft = apply_patches(record, patch)

        # A was changed
        self.assertEqual(draft["items"][0]["value"], "作文练习")
        # B and C become stale
        item = {i["id"]: i for i in draft["items"]}
        self.assertEqual(item["detail"]["status"], "stale",
                         "detail (B) must be stale after goal (A) changed")
        self.assertEqual(item["success"]["status"], "stale",
                         "success (C) must be stale after goal (A) changed (transitive)")
        # Unrelated items preserved
        self.assertEqual(item["audience"]["status"], "confirmed",
                         "audience must stay confirmed")
        self.assertEqual(item["no_login"]["status"], "confirmed",
                         "no_login (exclusion) must stay confirmed")
        self.assertEqual(item["no_login"]["value"], "不要登录",
                         "no_login value must not change")

    def test_changing_B_marks_C_stale_but_not_A_or_unrelated(self):
        """Changing detail (B) must mark success (C) stale but leave goal (A) confirmed."""
        record = chain_record()
        patch = [{"id": "detail", "field": "value", "new_value": "作文练习与反馈",
                  "evidence": {"source": "u3", "quote": "改成作文练习"}}]

        draft = apply_patches(record, patch)
        item = {i["id"]: i for i in draft["items"]}

        self.assertEqual(item["detail"]["value"], "作文练习与反馈")
        self.assertEqual(item["success"]["status"], "stale", "success (C) must be stale")
        self.assertEqual(item["goal"]["status"], "confirmed", "goal (A) must stay confirmed (upstream)")
        self.assertEqual(item["audience"]["status"], "confirmed")
        self.assertEqual(item["no_login"]["status"], "confirmed")

    # ------------------------------------------------------------------
    # 2. Old approval is cleared; not automatically re-confirmed
    # ------------------------------------------------------------------
    def test_approval_cleared_after_update(self):
        """After any patch, the approval key must be absent from the draft."""
        record = with_approval(chain_record())
        # Confirm approval is present before the update
        self.assertIn("approval", record)
        patch = [{"id": "goal", "field": "value", "new_value": "作文练习",
                  "evidence": {"source": "u3", "quote": "改成作文练习"}}]

        draft = apply_patches(record, patch)
        self.assertNotIn("approval", draft,
                         "approval must be cleared after any update")

    def test_noop_preserves_original_record_and_approval(self):
        """An unchanged value must not erase valid user approval or create work."""
        record = with_approval(chain_record())
        # 'no-op' patch: same value as already in the record
        patch = [{"id": "goal", "field": "value", "new_value": "学习与练习",
                  "evidence": {"source": "u3", "quote": "改成作文练习"}}]
        draft = apply_patches(record, patch)
        self.assertEqual(draft, record)

    # ------------------------------------------------------------------
    # 3. Original record is never mutated
    # ------------------------------------------------------------------
    def test_original_record_unchanged(self):
        """apply_patches must not mutate the input dict."""
        record = chain_record()
        original = copy.deepcopy(record)
        patch = [{"id": "goal", "field": "value", "new_value": "作文练习",
                  "evidence": {"source": "u3", "quote": "改成作文练习"}}]
        apply_patches(record, patch)
        self.assertEqual(record, original, "input record must not be mutated")

    # ------------------------------------------------------------------
    # 4. Output passes check_brief.inspect()
    # ------------------------------------------------------------------
    def test_output_is_structurally_valid(self):
        """The output of apply_patches must pass the existing structural checker."""
        record = chain_record()
        patch = [{"id": "goal", "field": "value", "new_value": "作文练习",
                  "evidence": {"source": "u3", "quote": "改成作文练习"}}]
        draft = apply_patches(record, patch)
        result = check_inspect(draft)
        self.assertTrue(result["structurally_valid"])

    # ------------------------------------------------------------------
    # 5. Evidence requirements — patch must cite a user source
    # ------------------------------------------------------------------
    def test_patch_without_user_evidence_fails(self):
        """A patch citing an assistant source must be rejected."""
        record = chain_record()
        record["sources"].append({"id": "a1", "role": "assistant", "text": "建议改成作文练习"})
        patch = [{"id": "goal", "field": "value", "new_value": "作文练习",
                  "evidence": {"source": "a1", "quote": "建议改成作文练习"}}]
        with self.assertRaises(ValueError, msg="assistant source must not satisfy patch evidence"):
            apply_patches(record, patch)

    def test_patch_with_fabricated_quote_fails(self):
        """A quote not present in the source text must be rejected."""
        record = chain_record()
        patch = [{"id": "goal", "field": "value", "new_value": "作文练习",
                  "evidence": {"source": "u3", "quote": "这段话不存在于 u3"}}]
        with self.assertRaises(ValueError, msg="quote not in source must be rejected"):
            apply_patches(record, patch)

    def test_patch_targeting_unknown_item_fails(self):
        """A patch targeting a non-existent item ID must be rejected."""
        record = chain_record()
        patch = [{"id": "nonexistent", "field": "value", "new_value": "anything",
                  "evidence": {"source": "u3", "quote": "改成作文练习"}}]
        with self.assertRaises(ValueError):
            apply_patches(record, patch)

    # ------------------------------------------------------------------
    # 6. Stale items have confirmation removed
    # ------------------------------------------------------------------
    def test_stale_items_lose_their_confirmation_field(self):
        """Items made stale by propagation must have their confirmation removed."""
        record = chain_record()
        patch = [{"id": "goal", "field": "value", "new_value": "作文练习",
                  "evidence": {"source": "u3", "quote": "改成作文练习"}}]
        draft = apply_patches(record, patch)
        item = {i["id"]: i for i in draft["items"]}
        self.assertNotIn("confirmation", item["detail"],
                         "stale item detail must not retain old confirmation")
        self.assertNotIn("confirmation", item["success"],
                         "stale item success must not retain old confirmation")
        # Unchanged confirmed items keep their confirmation
        self.assertIn("confirmation", item["audience"])
        self.assertIn("confirmation", item["no_login"])

    # ------------------------------------------------------------------
    # 7. CLI: file is written to output path; input file is not modified
    # ------------------------------------------------------------------
    def test_cli_writes_output_and_does_not_modify_input(self):
        script = _SCRIPTS / "update_brief.py"
        patch = [{"id": "goal", "field": "value", "new_value": "作文练习",
                  "evidence": {"source": "u3", "quote": "改成作文练习"}}]
        with tempfile.TemporaryDirectory() as tmp:
            inp = pathlib.Path(tmp) / "input.json"
            out = pathlib.Path(tmp) / "output.json"
            original_text = json.dumps(chain_record())
            inp.write_text(original_text)

            result = subprocess.run(
                [sys.executable, str(script), str(inp), json.dumps(patch), str(out)],
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, f"CLI failed: {result.stdout} {result.stderr}")
            # Input not modified
            self.assertEqual(inp.read_text(), original_text)
            # Output exists and is valid
            self.assertTrue(out.exists())
            draft = json.loads(out.read_text())
            r = check_inspect(draft)
            self.assertTrue(r["structurally_valid"])
            item = {i["id"]: i for i in draft["items"]}
            self.assertEqual(item["detail"]["status"], "stale")
            self.assertEqual(item["success"]["status"], "stale")

    def test_cli_refuses_to_overwrite_output_without_force(self):
        script = _SCRIPTS / "update_brief.py"
        patch = [{"id": "goal", "field": "value", "new_value": "作文练习",
                  "evidence": {"source": "u3", "quote": "改成作文练习"}}]
        with tempfile.TemporaryDirectory() as tmp:
            inp = pathlib.Path(tmp) / "input.json"
            out = pathlib.Path(tmp) / "existing.json"
            inp.write_text(json.dumps(chain_record()))
            out.write_text("existing")
            result = subprocess.run(
                [sys.executable, str(script), str(inp), json.dumps(patch), str(out)],
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 2)
            # existing file must not be overwritten
            self.assertEqual(out.read_text(), "existing")

    def test_cli_refuses_to_write_output_same_as_input(self):
        script = _SCRIPTS / "update_brief.py"
        patch = [{"id": "goal", "field": "value", "new_value": "作文练习",
                  "evidence": {"source": "u3", "quote": "改成作文练习"}}]
        with tempfile.TemporaryDirectory() as tmp:
            inp = pathlib.Path(tmp) / "input.json"
            inp.write_text(json.dumps(chain_record()))
            result = subprocess.run(
                [sys.executable, str(script), str(inp), json.dumps(patch), str(inp)],
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 2)

    # ------------------------------------------------------------------
    # 8. Rejected / excluded items are preserved regardless of ancestry
    # ------------------------------------------------------------------
    def test_rejected_items_preserved_unchanged(self):
        """Rejected and excluded items must be preserved; update must not delete them."""
        record = chain_record()
        # Add a rejected interpretation
        record["items"].append({
            "id": "paid_tier", "label": "付费功能", "value": "高级订阅",
            "kind": "requirement", "status": "rejected", "critical": False,
            "depends_on": [], "evidence": [],
        })
        patch = [{"id": "goal", "field": "value", "new_value": "作文练习",
                  "evidence": {"source": "u3", "quote": "改成作文练习"}}]
        draft = apply_patches(record, patch)
        item = {i["id"]: i for i in draft["items"]}
        self.assertIn("paid_tier", item, "rejected item must be preserved")
        self.assertEqual(item["paid_tier"]["status"], "rejected",
                         "rejected status must not change")


if __name__ == "__main__":
    unittest.main()
