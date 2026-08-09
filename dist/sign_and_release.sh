#!/usr/bin/env bash
# Fail on any error, any unset variable, and any failed stage of a pipe. Without
# this, the script previously ran past a missing artifact and signed an empty
# hash file, then reported "Good signature" on it.
set -euo pipefail

# Always operate from the directory this script lives in (dist/), regardless of
# the caller's working directory. `npm run release` invokes it from the repo
# root, where borderwallets.html and notes.md do not exist.
cd "$(dirname "$0")"

ARTIFACT="borderwallets.html"
HASHFILE="borderwallets.txt"
SIGFILE="borderwallets.txt.asc"

if [[ ! -f "$ARTIFACT" ]]; then
  echo "ERROR: $ARTIFACT not found in $(pwd); build it before releasing." >&2
  exit 1
fi

read -r -p ">> Enter the new version to release: " VERSION
read -r -p ">> Enter the email address of your PGP keys: " EMAIL

if [[ -z "$VERSION" || -z "$EMAIL" ]]; then
  echo "ERROR: version and PGP email are both required." >&2
  exit 1
fi

# Hash the exact artifact being released, then sign that hash.
sha256sum "$ARTIFACT" > "$HASHFILE"
rm -f "$SIGFILE"
gpg --sign --detach-sign --armor -u "$EMAIL" "$HASHFILE"

# Verify the detached signature against the hash file explicitly, and re-check
# that the signed hash still matches the artifact on disk. This closes the
# fail-open gap: a stale or empty hash file can no longer be published as
# "verified", because the signature would not cover the real artifact.
gpg --verify "$SIGFILE" "$HASHFILE"
if ! sha256sum -c "$HASHFILE"; then
  echo "ERROR: $HASHFILE does not match $ARTIFACT after signing; aborting." >&2
  exit 1
fi

gh release create "$VERSION" -F ./notes.md \
  "./$ARTIFACT#Entropy Grid Generator DOWNLOAD" \
  "./$HASHFILE" "./$SIGFILE"
echo "Done!"
