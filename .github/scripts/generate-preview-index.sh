#!/usr/bin/env bash
# Generates index.html listing all documentation previews in the current directory.
# Should be run from the root of the gh-pages-preview branch.

set -e

# Copy logo to root for the index page (from current build in /tmp/preview-dist when run from workflow)
if [ -d /tmp/preview-dist ] && [ -f /tmp/preview-dist/images/qonnectra_logo.png ]; then
  mkdir -p images
  cp /tmp/preview-dist/images/qonnectra_logo.png images/
fi

PREVIEW_DIRS=$(find . -maxdepth 1 -type d \( -name 'branch-*' -o -name 'pr-*' \) | sed 's|^\./||' | sort)

{
  echo '<!DOCTYPE html>'
  echo '<html lang="en">'
  echo '<head>'
  echo '  <meta charset="UTF-8">'
  echo '  <meta name="viewport" content="width=device-width, initial-scale=1.0">'
  echo '  <title>Qonnectra Docs – Preview Environments</title>'
  echo '  <style>'
  echo '    * { box-sizing: border-box; }'
  echo '    body { font-family: system-ui, -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 2rem 1.5rem; background: #f6f8fa; color: #1f2328; line-height: 1.5; }'
  echo '    .container { background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,.08); }'
  echo '    h1 { font-size: 1.5rem; font-weight: 600; color: #1f2328; margin: 0 0 0.25rem 0; }'
  echo '    .subtitle { color: #656d76; font-size: 0.95rem; margin-bottom: 1.5rem; }'
  echo '    .section { margin-bottom: 1.5rem; }'
  echo '    .section:last-child { margin-bottom: 0; }'
  echo '    .section h2 { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #656d76; margin: 0 0 0.75rem 0; }'
  echo '    ul { list-style: none; padding: 0; margin: 0; }'
  echo '    li { margin: 0.5rem 0; }'
  echo '    a { display: block; padding: 0.75rem 1rem; border-radius: 8px; color: #0969da; text-decoration: none; font-weight: 500; transition: background 0.15s; }'
  echo '    a:hover { background: #eaeef2; text-decoration: none; }'
  echo '    .branch a, .pr a { border-left: 3px solid #11ba81; }'
  echo '    .header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }'
  echo '    .header img { height: 40px; width: auto; }'
  echo '  </style>'
  echo '</head>'
  echo '<body>'
  echo '  <div class="container">'
  echo '    <header class="header">'
  if [ -f images/qonnectra_logo.png ]; then
    echo '      <img src="images/qonnectra_logo.png" alt="Qonnectra" />'
  fi
  echo '      <h1>Qonnectra Docs</h1>'
  echo '    </header>'
  echo '    <p class="subtitle">Available preview environments — click to view deployed documentation</p>'
  echo '    <div class="section">'
  echo '      <h2>Branch previews</h2>'
  echo '      <ul class="branch-list">'
  for dir in $PREVIEW_DIRS; do
    if [[ "$dir" == branch-* ]]; then
      branch="${dir#branch-}"
      label="$branch"
      [[ "$branch" == "main" ]] && label="main (default)"
      echo "        <li class=\"branch\"><a href=\"$dir/\">$label</a></li>"
    fi
  done
  echo '      </ul>'
  echo '    </div>'
  echo '    <div class="section">'
  echo '      <h2>Pull request previews</h2>'
  echo '      <ul class="pr-list">'
  for dir in $PREVIEW_DIRS; do
    if [[ "$dir" == pr-* ]]; then
      num="${dir#pr-}"
      label="PR #$num"
      echo "        <li class=\"pr\"><a href=\"$dir/\">$label</a></li>"
    fi
  done
  echo '      </ul>'
  echo '    </div>'
  echo '  </div>'
  echo '</body>'
  echo '</html>'
} > index.html
