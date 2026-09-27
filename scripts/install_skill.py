"""Copy IntentConfirm into a project's Skill folder; no network or dependencies."""
import argparse
from pathlib import Path
import shutil
import sys
import tempfile
from package_skill import SOURCE, payload


def destination(project, client):
    project = Path(project).expanduser().absolute()
    if not project.is_dir():
        raise ValueError('Project folder does not exist: ' + str(project))
    return project / ('.bob' if client == 'bob' else '.claude') / 'skills/intentconfirm'


def check(target, files):
    problems = []
    for name, data in files.items():
        p = target / name
        if p.is_symlink() or not p.is_file():
            problems.append('missing or symlink: ' + name)
        elif p.read_bytes() != data:
            problems.append('different: ' + name)
    return problems


def install(target, source=SOURCE, check_only=False):
    target = Path(target).expanduser().absolute()
    files = payload(source)
    if any(p.is_symlink() for p in (target, *target.parents)):
        raise ValueError('Destination symlinks are not supported; select a real project folder.')
    if check_only:
        problems = check(target, files)
        if problems:
            raise ValueError('File check failed:\n' + '\n'.join(problems))
        return 'Files match this download. Check activation in your AI assistant.'
    if target.exists():
        if target.is_dir() and not check(target, files):
            return 'Already installed: files match this download.'
        raise ValueError('Destination exists and differs. Nothing overwritten. Back it up outside the Skills folder, then retry: ' + str(target))
    target.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix='.intentconfirm-install-', dir=target.parent))
    try:
        for name, data in files.items():
            p = staging / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(data)
        if target.exists():
            raise ValueError('Destination appeared during install. Nothing overwritten.')
        staging.rename(target)
    finally:
        if staging.exists():
            shutil.rmtree(staging)
    return 'Installed files at ' + str(target) + '\nOpen the project in your assistant and start a new conversation.'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--client', choices=('bob', 'claude'), help='Project-level installation')
    group.add_argument('--dest', type=Path, help='Exact Skill folder for another compatible host')
    parser.add_argument('--project', type=Path, help='Existing project folder (required with --client)')
    parser.add_argument('--check', action='store_true', help='Only compare installed files; does not test model activation')
    args = parser.parse_args()
    if args.client and args.project is None:
        parser.error('--client requires --project')
    if args.dest and args.project:
        parser.error('--dest and --project cannot be combined')
    try:
        target = destination(args.project, args.client) if args.client else args.dest
        print(install(target, check_only=args.check))
    except (OSError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
