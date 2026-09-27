"""Build the public, deterministic Skill ZIP using an explicit file allowlist."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / '.bob/skills/intentconfirm'
FILES = (
    'SKILL.md', 'LICENSE', 'agents/openai.yaml', 'assets/icon.svg',
    'references/interaction-patterns.md', 'references/record-format.md',
    'scripts/check_brief.py', 'scripts/update_brief.py',
)


def payload(source=SOURCE):
    source = Path(source)
    result = {}
    for name in FILES:
        path = source / name
        if any(p.is_symlink() for p in (path, *path.parents)):
            raise ValueError('Symlinks are not allowed in the release source: ' + name)
        result[name] = path.read_bytes()
    return result


def build(output, source=SOURCE):
    files = payload(source)
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name, data in sorted(files.items()):
            info = zipfile.ZipInfo('intentconfirm/' + name, (2026, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, data)
    return hashlib.sha256(output.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify the committed archive against source')
    args = parser.parse_args()
    output = ROOT / 'downloads/intentconfirm-skill.zip'
    checksum = output.with_suffix('.sha256')
    if args.check:
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            candidate = Path(tmp) / output.name
            digest = build(candidate)
            if not output.exists() or candidate.read_bytes() != output.read_bytes():
                raise SystemExit('Release ZIP differs from source. Run python3 scripts/package_skill.py')
            if checksum.read_text().strip() != digest + '  ' + output.name:
                raise SystemExit('Release checksum differs.')
        print('Release ZIP matches source; checksum verified.')
    else:
        digest = build(output)
        checksum.write_text(digest + '  ' + output.name + '\n', encoding='utf-8')
        print(json.dumps({'archive': str(output), 'sha256': digest, 'files': len(FILES)}))


if __name__ == '__main__':
    main()
