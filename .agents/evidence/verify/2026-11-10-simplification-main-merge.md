# Canonical CLI documentation mainline merge — 2026-11-10

Scope: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/pull/49 .

Merge fixed main `c5e2b6250a023312f999bf2cc1112bab81121b25` into the published simplification branch without rebase or force-push. Main added only the preview/community announcement and QR replacement. A read-only merge-tree review found no conflicts, and parent review approved preserving both mainline community content and the current CLI guidance. Provider implementations, manifests, catalog capabilities and dependency versions are unchanged.

## Verification

- Both README announcement/community lines match fixed upstream.
- QR image and four upstream engineering records match upstream bytes.
- Seven merged Markdown files checked for local file links; no missing targets. Remote URLs and anchor fragments were not checked.
- Git diff whitespace check passed. The canonical CLI note, CHANGELOG entry and existing guidance remain retained.
- OpenSandbox T0 rerun: 63 passed, 0 failed, 0 skipped. Project/workflow T0 rerun: 16 passed, 0 failed, 0 skipped. No cloud operation was performed; remote CI must rerun on this merge commit.

No package version, release state, credential policy or provider qualification changed.
