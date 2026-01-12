# GitHub Pages PR Preview Setup

This directory contains GitHub Actions workflows for deploying documentation to GitHub Pages, including PR preview environments.

## Workflows

### `deploy.yml`
Deploys the main documentation site to GitHub Pages when changes are pushed to the `main` branch.

### `preview.yml`
Creates a preview deployment for each pull request. The preview is deployed to a PR-specific subdirectory.

### `cleanup-preview.yml`
Cleans up preview deployments when a pull request is closed.

## GitHub Pages Limitations

⚠️ **Important**: GitHub Pages can only serve from **one branch** at a time per repository. This creates a challenge for PR previews.

### Current Setup

The workflows are configured to:
1. Deploy the main site to GitHub Pages (via `deploy.yml`)
2. Deploy PR previews to the `gh-pages-preview` branch (via `preview.yml`)

### Options for PR Previews

#### Option 1: Separate Preview Domain (Recommended)
1. Set up a custom domain or subdomain for previews (e.g., `preview.qonnectra.de`)
2. Configure GitHub Pages to serve from the `gh-pages-preview` branch on that domain
3. PR previews will be accessible at: `https://preview.qonnectra.de/pr-{PR_NUMBER}/`

#### Option 2: Use Netlify/Vercel (Easier)
These platforms have built-in PR preview support:
- **Netlify**: Automatically creates preview deployments for each PR
- **Vercel**: Similar automatic PR preview functionality

#### Option 3: Single Branch with Subdirectories
Deploy both main site and previews to the same branch:
- Main site: `/` (root)
- PR previews: `/pr-{PR_NUMBER}/`

This requires careful coordination to avoid conflicts.

## Configuration

### Environment Variables

The VitePress config uses the `BASE_PATH` environment variable to set the base URL:
- Production: `/Qonnectra-docs/`
- PR Preview: `/Qonnectra-docs/pr-{PR_NUMBER}/`

### Required GitHub Settings

1. **Enable GitHub Pages**: Repository Settings → Pages → Source: "GitHub Actions"
2. **For Option 1**: Configure a second Pages site for the preview branch (requires custom domain)

## How It Works

1. When a PR is opened/updated, `preview.yml` builds the site with a PR-specific base path
2. The built site is deployed to `gh-pages-preview` branch in a PR-specific directory
3. A comment is added to the PR with the preview URL
4. When the PR is closed, `cleanup-preview.yml` removes the preview deployment

## Troubleshooting

- **Preview not accessible**: Ensure GitHub Pages is configured to serve from the correct branch
- **Base path issues**: Verify the `BASE_PATH` environment variable is set correctly in the workflow
- **Build failures**: Check that all dependencies are installed correctly (pnpm is used)

