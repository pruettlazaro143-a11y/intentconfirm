"""Synthetic fixtures only. Tests structure, not host-model understanding."""
import copy
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest
from check_brief import inspect


def record():
    return {"schema_version": 1, "sources": [{"id": "u1", "role": "user", "text": "给自己用，不要登录"}], "items": [
        {"id": "audience", "label": "受众", "value": "自己", "kind": "requirement", "status": "stated", "critical": True, "depends_on": [], "evidence": [{"source": "u1", "quote": "给自己用"}]}]}


def approve(d):
    d["sources"].append({"id": "u2", "role": "user", "text": "就按这份来"})
    d["approval"] = {"source": "u2", "quote": "就按这份来", "digest": inspect(d)["digest"]}
    return d


class Tests(unittest.TestCase):
    def test_explicit_fact_does_not_imply_whole_brief_approval(self):
        r = inspect(record())
        self.assertFalse(r["recorded_approval_current"])
        self.assertEqual(r["active_scope_ids"], ["audience"])

    def test_exact_quote_is_required(self):
        d = record(); d["items"][0]["evidence"][0]["quote"] = "不要支付"
        with self.assertRaises(ValueError): inspect(d)

    def test_assistant_cannot_supply_user_consent(self):
        d = record(); d["sources"][0]["role"] = "assistant"
        with self.assertRaises(ValueError): inspect(d)

    def test_unknown_critical_item_blocks_even_with_recorded_approval(self):
        d = record(); d["items"][0]["status"] = "unknown"; approve(d)
        r = inspect(d)
        self.assertTrue(r["recorded_approval_current"])
        self.assertFalse(r["confirmed_record_consistent"])
        self.assertEqual(r["blocking_items"], ["audience"])

    def test_edit_invalidates_approval_without_mutating_saved_snapshot(self):
        d = approve(record()); snapshot = copy.deepcopy(d)
        self.assertTrue(inspect(d)["recorded_approval_current"])
        d["items"][0]["value"] = "给学生使用"
        self.assertFalse(inspect(d)["recorded_approval_current"])
        self.assertTrue(inspect(snapshot)["recorded_approval_current"])

    def test_optional_assumption_stays_visible_without_becoming_active_scope(self):
        d = record(); i = d["items"][0]; i.update(kind="assumption", status="candidate", critical=False)
        r = inspect(d)
        self.assertEqual(r["blocking_items"], [])
        self.assertEqual(r["unresolved_items"], ["audience"])
        self.assertEqual(r["active_scope_ids"], [])

    def test_dependency_conflict_cannot_be_hidden_by_current_digest(self):
        d = record(); child = copy.deepcopy(d["items"][0]); child.update(id="child", depends_on=["audience"])
        d["items"].append(child); d["items"][0]["status"] = "rejected"; approve(d)
        r = inspect(d); self.assertIn("child", r["blocking_items"])
        self.assertFalse(r["confirmed_record_consistent"])

    def test_cycle_and_missing_dependency(self):
        for dep in ["audience", "missing"]:
            d = record(); d["items"][0]["depends_on"] = [dep]
            with self.assertRaises(ValueError): inspect(d)

    def test_confirmation_must_have_actual_user_source(self):
        d = record(); d["items"][0]["status"] = "confirmed"
        with self.assertRaises(ValueError): inspect(d)
        d["items"][0]["confirmation"] = {"source": "u1", "quote": "给自己用"}
        self.assertTrue(inspect(d)["structurally_valid"])

    def test_cli_reads_file_without_modifying_it(self):
        script = pathlib.Path(__file__).with_name("check_brief.py")
        with tempfile.TemporaryDirectory() as tmp:
            p = pathlib.Path(tmp) / "brief.json"; original = json.dumps(record()); p.write_text(original)
            result = subprocess.run([sys.executable, str(script), str(p)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0); self.assertTrue(json.loads(result.stdout)["structurally_valid"])
            self.assertEqual(p.read_text(), original)
            p.write_text("null")
            result = subprocess.run([sys.executable, str(script), str(p)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 2)


    def test_stale_upstream_makes_active_child_a_blocking_item(self):
        """Changing an upstream item to stale must flag active dependents as blocked.
        This exercises the 'upstream changed → re-check dependents' requirement (§3)."""
        d = record()
        # Add a child item that depends on 'audience'
        child = {
            "id": "child_req",
            "label": "子需求",
            "value": "依赖受众的功能",
            "kind": "requirement",
            "status": "confirmed",
            "critical": True,
            "depends_on": ["audience"],
            "evidence": [{"source": "u1", "quote": "给自己用"}],
            "confirmation": {"source": "u1", "quote": "给自己用"},
        }
        d["items"].append(child)
        # Sanity: both active → no conflicts
        r_ok = inspect(d)
        self.assertEqual(r_ok["dependency_conflicts"], [])
        # Mark upstream 'audience' as stale (upstream answer was changed)
        d["items"][0]["status"] = "stale"
        r = inspect(d)
        # child_req is active but its dependency is now stale (UNRESOLVED) → must be blocked
        self.assertIn("child_req", r["blocking_items"])
        self.assertIn({"item": "child_req", "dependency": "audience"}, r["dependency_conflicts"])
        # confirmed_record_consistent must be False even if a digest-matching approval exists
        approve(d)
        r2 = inspect(d)
        self.assertTrue(r2["recorded_approval_current"])
        self.assertFalse(r2["confirmed_record_consistent"])


if __name__ == "__main__":
    unittest.main()
