#!/usr/bin/env bash
if test "$BASH" = "" || "$BASH" -uc "a=();true \"\${a[@]}\"" 2>/dev/null; then
	# Bash 4.4, Zsh
	set -euo pipefail
else
	# Bash 4.3 and older chokes on empty arrays with set -u.
	set -eo pipefail
fi
shopt -s nullglob
FIS=$'\n\t'

FILES=(
  README.md
  package.json
  AUTHORS
  LICENSE
)

for file in "${FILES[@]}"; do
  cp $file lib/$file
done
