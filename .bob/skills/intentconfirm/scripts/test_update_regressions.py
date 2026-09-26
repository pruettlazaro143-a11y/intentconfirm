"""Codex regressions for the uploaded Bob updater. No real-model assertions."""
import copy
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import unittest
from test_update_brief import chain_record, with_approval
from update_brief import apply_patches


def patch(iid="goal", value="作文练习", source="u3"):
    return {"id": iid, "field": "value", "new_value": value,
            "evidence": {"source": source, "quote": "改成作文练习"}}


class RegressionTests(unittest.TestCase):
    def test_changed_root_drops_old_consent_and_retains_current_source(self):
        old = chain_record(); new = apply_patches(old, [patch()]); root = new["items"][0]
        self.assertEqual(root["status"], "candidate")
        self.assertNotIn("confirmation", root)
        self.assertEqual(root["evidence"], [patch()["evidence"]])
        self.assertEqual(new["change_log"][0]["previous_items"]["goal"], old["items"][0])

    def test_two_changed_roots_never_keep_old_confirmation(self):
        changes = [patch(), patch("detail", "作文反馈")]
        new = apply_patches(chain_record(), changes)
        self.assertEqual([i["status"] for i in new["items"][:3]], ["candidate", "candidate", "stale"])
        for i in new["items"][:3]: self.assertNotIn("confirmation", i)
        self.assertEqual(new, apply_patches(chain_record(), changes))
        reversed_new = apply_patches(chain_record(), list(reversed(changes)))
        self.assertEqual(new["items"], reversed_new["items"])

    def test_new_user_turn_can_be_added_without_editing_old_record(self):
        old = chain_record(); old["sources"] = old["sources"][:2]; snap = copy.deepcopy(old)
        new = apply_patches(old, [patch(source="u_new")], [{"id": "u_new", "role": "user", "text": "改成作文练习"}])
        self.assertEqual(old, snap)
        self.assertEqual(new["items"][0]["evidence"][0]["source"], "u_new")
        self.assertEqual(len(new["sources"]), 3)

    def test_old_sources_cannot_be_overwritten(self):
        with self.assertRaises(ValueError):
            apply_patches(chain_record(), [patch()], [{"id": "u1", "role": "user", "text": "改成作文练习"}])

    def test_invalid_input_is_rejected_before_patch_can_repair_it(self):
        old = chain_record(); old["items"][0]["status"] = "broken"
        p = patch(); p.update(field="status", new_value="candidate")
        with self.assertRaises(ValueError): apply_patches(old, [p])

    def test_status_patch_cannot_reuse_old_confirmation_to_accept_new_value(self):
        p = patch(); p.update(field="status", new_value="confirmed")
        with self.assertRaises(ValueError): apply_patches(chain_record(), [patch(), p])

    def test_duplicate_conflicting_field_patches_fail_atomically(self):
        old = chain_record(); snap = copy.deepcopy(old)
        with self.assertRaises(ValueError): apply_patches(old, [patch(), patch(value="另一个目标")])
        self.assertEqual(old, snap)

    def test_malformed_patch_batch_fails_without_mutation(self):
        old = chain_record(); snap = copy.deepcopy(old)
        for patches in [None, {}, [patch(), {"id": "missing"}]]:
            with self.assertRaises(ValueError): apply_patches(old, patches)
        self.assertEqual(old, snap)

    def test_stale_propagates_through_unknown_middle_item(self):
        old = chain_record(); old["items"][1]["status"] = "unknown"
        new = apply_patches(old, [patch()])
        self.assertEqual(new["items"][1]["status"], "unknown")
        self.assertEqual(new["items"][2]["status"], "stale")

    def test_cycle_and_missing_dependency_cannot_be_ignored(self):
        for deps in [["success"], ["missing"]]:
            old = chain_record(); old["items"][0]["depends_on"] = deps
            with self.assertRaises(ValueError): apply_patches(old, [patch()])

    def test_empty_batch_preserves_approval(self):
        old = with_approval(chain_record())
        self.assertEqual(apply_patches(old, []), old)

    def test_cli_accepts_new_turn_envelope(self):
        script = pathlib.Path(__file__).with_name("update_brief.py")
        with tempfile.TemporaryDirectory() as tmp:
            old, changes, out = [pathlib.Path(tmp)/n for n in ["old.json", "changes.json", "new.json"]]
            r = chain_record(); r["sources"] = r["sources"][:2]; old.write_text(json.dumps(r))
            changes.write_text(json.dumps({"sources": [{"id": "u_new", "role": "user", "text": "改成作文练习"}], "patches": [patch(source="u_new")]}))
            result = subprocess.run([sys.executable, str(script), str(old), str(changes), str(out)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertEqual(json.loads(out.read_text())["items"][0]["status"], "candidate")
            self.assertEqual(json.loads(old.read_text()), r)

    def test_cli_cannot_overwrite_input_through_file_aliases(self):
        script = pathlib.Path(__file__).with_name("update_brief.py")
        with tempfile.TemporaryDirectory() as tmp:
            old = pathlib.Path(tmp)/"old.json"; original = json.dumps(chain_record()); old.write_text(original)
            hard, sym = pathlib.Path(tmp)/"hard.json", pathlib.Path(tmp)/"sym.json"
            os.link(old, hard); sym.symlink_to(old)
            for out in [old, hard, sym]:
                for flags in [[], ["--force"]]:
                    r = subprocess.run([sys.executable, str(script), str(old), json.dumps([patch()]), str(out)] + flags, capture_output=True, text=True)
                    self.assertEqual(r.returncode, 2)
                    self.assertEqual(old.read_text(), original)


if __name__ == "__main__":
    unittest.main()
