#!/usr/bin/env bash
# Builds the game and publishes dist/ to the gh-pages branch (GitHub Pages source).
# usage: scripts/deploy-pages.sh "<commit message>"
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MSG="${1:-배포}"
cd "$ROOT"
npm run build
WORK="$(mktemp -d)"
git clone --quiet --depth 1 --branch gh-pages "$(git remote get-url origin)" "$WORK"
find "$WORK" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r dist/. "$WORK/"
touch "$WORK/.nojekyll"
cd "$WORK"
git add -A
if git diff --cached --quiet; then
  echo "nothing to deploy"
else
  git -c user.name="$(git -C "$ROOT" config user.name)" -c user.email="$(git -C "$ROOT" config user.email)" commit --quiet -m "$MSG"
  git push --quiet origin gh-pages
  echo "deployed"
fi
rm -rf "$WORK"
