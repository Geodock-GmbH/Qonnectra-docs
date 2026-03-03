#!/usr/bin/env bash
# Generates index.html listing all documentation previews in the current directory.
# Should be run from the root of the gh-pages-preview branch.

set -e

PREVIEW_DIRS=$(find . -maxdepth 1 -type d ! -name '.' ! -name '.git' | sed 's|^\./||' | sort)

{
  echo '<!DOCTYPE html>'
  echo '<html lang="en">'
  echo '<head>'
  echo '  <meta charset="UTF-8">'
  echo '  <meta name="viewport" content="width=device-width, initial-scale=1.0">'
  echo '  <title>Documentation Previews</title>'
  echo '  <style>'
  echo '    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }'
  echo '    h1 { color: #333; }'
  echo '    ul { list-style: none; padding: 0; }'
  echo '    li { margin: 0.5rem 0; }'
  echo '    a { color: #0969da; text-decoration: none; }'
  echo '    a:hover { text-decoration: underline; }'
  echo '    .branch { color: #0550ae; }'
  echo '    .pr { color: #953800; }'
  echo '  </style>'
  echo '</head>'
  echo '<body>'
  echo '  <h1>Documentation Previews</h1>'
  echo '  <p>Select a preview to view:</p>'
  echo '  <ul>'
  for dir in $PREVIEW_DIRS; do
    class="branch"
    label="$dir"
    if [[ "$dir" == pr-* ]]; then
      class="pr"
      num="${dir#pr-}"
      label="PR #$num"
    elif [[ "$dir" == branch-* ]]; then
      branch="${dir#branch-}"
      label="$branch"
      [[ "$branch" == "main" ]] && label="main (default)"
    fi
    echo "    <li class=\"$class\"><a href=\"$dir/\">$label</a></li>"
  done
  echo '  </ul>'
  echo '</body>'
  echo '</html>'
} > index.html
