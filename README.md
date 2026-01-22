# Qonnectra Documentation

This is the documentation site for Qonnectra - Network documentation for municipal infrastructures, built with [VitePress](https://vitepress.dev/).

[Visit the official Qonnectra website](https://qonnectra.de)

## Getting Started

### 🚀 Quick Start with GitHub Codespaces

The easiest way to get started with this documentation project is using **GitHub Codespaces**. Simply click the green "Code" button in the repository and select "Codespaces" → "Create codespace on main". 

**Benefits:**
- ✅ No local setup required - everything is pre-configured
- ✅ Dependencies are automatically installed
- ✅ Development server starts automatically
- ✅ Works in your browser - no need to install Node.js or pnpm locally
- ✅ Consistent development environment for all contributors

The project includes a `.devcontainer` configuration that sets up Node.js 24, pnpm 10, and automatically runs `pnpm install` and `pnpm dev` when the codespace starts. Your documentation site will be available at `http://localhost:5173` and automatically forwarded to your browser.

> **Tip:** If you prefer local development, continue reading the Prerequisites section below.

### Prerequisites

- Node.js 24 (specified in `package.json`)
- pnpm 10 (specified in `package.json`)

> **Note:** This project includes a `.devcontainer` configuration for GitHub Codespaces. When opening this repository in Codespaces, dependencies will be installed and the dev server will start automatically.

### Installation

1. Install dependencies:

```bash
pnpm install
```

### Development

Start the development server:

```bash
pnpm dev
```

The documentation site will be available at `http://localhost:5173`

### Build

Build the documentation site for production:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Project Structure

```
docs/
├── .vitepress/
│   ├── config.ts          # VitePress configuration
│   └── theme/
│       └── index.ts       # Custom theme
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Pages deployment
├── manual/
│   └── index.md           # Manual section
├── best-practices/
│   └── index.md           # Best practices section
├── index.md               # Homepage
└── package.json           # Dependencies and scripts
```

## Algolia DocSearch Setup

This documentation site uses [Algolia DocSearch](https://docsearch.algolia.com/) for site-wide search functionality, similar to Vue.js and VueUse.org.

### Applying for Algolia DocSearch

Algolia DocSearch is **free for open-source documentation projects**. To set it up:

1. **Apply for DocSearch**: Visit [docsearch.algolia.com/apply/](https://docsearch.algolia.com/apply/) and submit your documentation site URL.

2. **Wait for Approval**: Algolia typically approves open-source projects quickly. You'll receive an email with your credentials.

3. **Update Configuration**: Once approved, Algolia will provide you with:
   - `appId`: Your Algolia application ID
   - `apiKey`: Your search-only API key
   - `indexName`: Your index name

4. **Configure VitePress**: Update `.vitepress/config.ts` with your credentials:

```typescript
search: {
  provider: 'algolia',
  options: {
    appId: 'YOUR_APP_ID',           // Replace with your app ID
    apiKey: 'YOUR_SEARCH_API_KEY',  // Replace with your API key
    indexName: 'YOUR_INDEX_NAME',   // Replace with your index name
  }
}
```

5. **Automatic Indexing**: Algolia will automatically crawl and index your documentation site. No manual indexing is required!

### Important Notes

- The search will only work after you've received and configured your Algolia credentials
- Make sure your site is publicly accessible (deployed) for Algolia to crawl it
- The placeholder credentials in the config file will not work - you must apply and get approved first

## Deployment

### GitHub Pages

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

1. **Enable GitHub Pages**: In your repository settings, go to Pages and set the source to "GitHub Actions"

2. **Update Base URL**: If your repository name is different from `qonnectra`, update the `base` field in `.vitepress/config.ts`:

```typescript
base: '/your-repo-name/',
```

3. **Push to Main**: Push your changes to the `main` branch, and GitHub Actions will automatically build and deploy your site.

The workflow is configured in `.github/workflows/deploy.yml`.

## Writing Documentation

### Adding New Pages

1. Create a new `.md` file in the appropriate directory
2. Add the page to the sidebar in `.vitepress/config.ts`
3. Use frontmatter for page metadata:

```markdown
---
title: Page Title
description: Page description
---
```

### Markdown Features

VitePress supports:
- Code highlighting with syntax highlighting
- Line numbers in code blocks
- Custom containers (tip, warning, danger, etc.)
- Vue components in markdown
- And much more!

See the [VitePress documentation](https://vitepress.dev/) for more details.

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](https://github.com/Geodock-GmbH/Qonnectra/blob/main/LICENSE) file in the main repository for details.

