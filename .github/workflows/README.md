# GitHub Pages Deployment Setup

This directory contains GitHub Actions workflows for deploying documentation to GitHub Pages.

## Workflows

### `deploy.yml`
Deploys the main documentation site to GitHub Pages when changes are pushed to the `main` branch.

### `preview.yml`
Builds a preview version of the documentation for each pull request. The build artifact is uploaded and instructions are provided for manual GitHub Pages setup.

## How It Works

### Production Deployment (`deploy.yml`)
1. When changes are pushed to the `main` branch, the workflow automatically builds and deploys the site
2. The site is deployed via GitHub Actions to GitHub Pages
3. The site is available at: `https://geodock-gmbh.github.io/Qonnectra-docs/`

### PR Preview Build (`preview.yml`)
1. When a PR is opened/updated, the workflow builds the site with a PR-specific base path
2. The build artifact is uploaded and available for download from the Actions tab
3. A comment is added to the PR with instructions for manually enabling GitHub Pages
4. **Manual step required**: Users must manually configure GitHub Pages for their branch if they want a live preview

## Manual PR Preview Setup

To enable a GitHub Pages preview for your PR branch:

1. Go to **Repository Settings → Pages**
2. Under "Source", select **"Deploy from a branch"**
3. Select your PR branch (e.g., `feature/my-changes`)
4. Select folder: `/.vitepress/dist`
5. Click **Save**

⚠️ **Important Notes:**
- GitHub Pages can only serve from **one branch** at a time per repository
- Enabling Pages for a PR branch will temporarily replace the main site
- Remember to switch back to `main` branch after reviewing
- The preview build uses base path `/Qonnectra-docs/pr-{PR_NUMBER}/` - make sure your GitHub Pages URL matches this

## Configuration

### Environment Variables

The VitePress config uses the `BASE_PATH` environment variable to set the base URL:
- **Local development**: `/` (default)
- **Production**: `/Qonnectra-docs/` (set in `deploy.yml`)
- **PR Preview**: `/Qonnectra-docs/pr-{PR_NUMBER}/` (set in `preview.yml`)

### Required GitHub Settings

1. **Enable GitHub Pages**: Repository Settings → Pages → Source: "GitHub Actions"
2. This enables automatic deployment for the `main` branch

## Troubleshooting

- **Preview not accessible**: Ensure GitHub Pages is manually configured for your PR branch
- **Base path issues**: Verify the `BASE_PATH` environment variable matches your GitHub Pages URL structure
- **Build failures**: Check that all dependencies are installed correctly (pnpm is used)
- **Build artifact not found**: Check the Actions tab for the workflow run and download the artifact

