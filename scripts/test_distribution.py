import hashlib
from pathlib import Path
import tempfile
import unittest
import zipfile
from install_skill import install, destination
from package_skill import build, payload, FILES


class DistributionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def test_new_project_install_and_check(self):
        for client, folder in [('bob', '.bob'), ('claude', '.claude')]:
            with self.subTest(client=client):
                target = destination(self.root, client)
                self.assertEqual(target, self.root / folder / 'skills/intentconfirm')
                install(target)
                self.assertIn('Files match', install(target, check_only=True))

    def test_repeat_install_preserves_local_extra_file(self):
        target = self.root / 'intentconfirm'
        install(target)
        (target / 'my-notes.txt').write_text('keep')
        self.assertIn('Already installed', install(target))
        self.assertEqual((target / 'my-notes.txt').read_text(), 'keep')

    def test_modified_install_is_not_overwritten(self):
        target = self.root / 'intentconfirm'
        install(target)
        (target / 'SKILL.md').write_text('my changes')
        with self.assertRaises(ValueError):
            install(target)
        self.assertEqual((target / 'SKILL.md').read_text(), 'my changes')

    def test_missing_install_check_does_not_write(self):
        target = self.root / 'missing'
        with self.assertRaises(ValueError):
            install(target, check_only=True)
        self.assertFalse(target.exists())

    def test_missing_source_leaves_no_partial_install(self):
        target = self.root / 'target'
        with self.assertRaises(FileNotFoundError):
            install(target, source=self.root / 'missing')
        self.assertFalse(target.exists())

    def test_symlink_destination_rejected(self):
        outside = self.root / 'outside'
        outside.mkdir()
        link = self.root / 'link'
        try:
            link.symlink_to(outside, target_is_directory=True)
        except OSError:
            self.skipTest('Symlink creation unavailable on this system')
        with self.assertRaises(ValueError):
            install(link / 'intentconfirm')
        self.assertEqual(list(outside.iterdir()), [])

    def test_archive_is_deterministic_and_complete(self):
        a, b = self.root / 'a.zip', self.root / 'b.zip'
        self.assertEqual(build(a), build(b))
        self.assertEqual(a.read_bytes(), b.read_bytes())
        with zipfile.ZipFile(a) as z:
            self.assertEqual(set(z.namelist()), {'intentconfirm/' + n for n in FILES})
            for name, data in payload().items():
                self.assertEqual(z.read('intentconfirm/' + name), data)
        self.assertEqual(hashlib.sha256(a.read_bytes()).hexdigest(), build(b))

    def test_secrets_and_user_records_excluded(self):
        source = self.root / 'source'
        for name, data in payload().items():
            p = source / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(data)
        for name in ('.env', 'private-brief.json', 'record.txt'):
            (source / name).write_text('private fixture only')
        archive = self.root / 'skill.zip'
        build(archive, source)
        with zipfile.ZipFile(archive) as z:
            self.assertFalse(any('private' in n or '.env' in n or 'record.txt' in n for n in z.namelist()))


if __name__ == '__main__':
    unittest.main()
