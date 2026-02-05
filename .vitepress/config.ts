import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'
import { VitePressSidebarOptions } from 'vitepress-sidebar/types'

function generateSidebarConfig(path: string, override: Partial<VitePressSidebarOptions> = {}): VitePressSidebarOptions {
  return {
    scanStartPath: path,
    resolvePath: `/${path}/`,
    useTitleFromFileHeading: true,
    useTitleFromFrontmatter: true,
    useFolderTitleFromIndexFile: true,
    includeRootIndexFile: true,
    includeFolderIndexFile: false,
    collapsed: false,
    sortFolderTo: 'bottom',
    folderLinkNotIncludesFileName: true,
    useFolderLinkFromIndexFile: true,
    ...override,
  }
}

// Base URL for GitHub Pages deployment
// Defaults to "/" for local development, can be overridden via BASE_PATH environment variable
// Production builds set BASE_PATH="/Qonnectra-docs/" in GitHub Actions workflows
const base = (typeof process !== 'undefined' && process.env?.BASE_PATH) || '/';

const withBase = (path: string) => `${base.endsWith('/') ? base : `${base}/`}${path.replace(/^\/+/, '')}`

export default defineConfig({
  title: 'Qonnectra',
  description: 'Netzdokumentation für kommunale Infrastrukturen - Handbuch',
  lang: 'de',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],

  base,

  // Markdown configuration
  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  },

  // Theme configuration
  themeConfig: {
    logo: '/images/qonnectra_logo.png',
    // Site navigation
    nav: [
      { text: 'Startseite', link: '/' },
      { text: 'Handbuch', link: '/manual/' },
      { text: 'Kontakt', link: '/contact' }
    ],

    // Sidebar navigation - auto-generated from file structure
    sidebar: generateSidebar([
      generateSidebarConfig('manual')
    ]),

    // German translation in doc footer
    docFooter: {
      prev: 'Vorherige Seite',
      next: 'Nächste Seite'
    },

    // Footer
    footer: {
      message: [
        `<a href="${withBase('imprint')}">Impressum</a> · <a href="${withBase('privacy')}">Datenschutz</a> · <a href="${withBase('contact')}">Kontakt</a>`,
        '', // leere Zeile
        'Open-Source-Software für kommunale Netzdokumentation. Lizenziert unter AGPL-3.0.'
      ].join('<br>'),
      copyright: 'Copyright © 2025 Geodock GmbH & plan[neo] GmbH'
    },

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Geodock-GmbH/Qonnectra' }
    ],

    // External link icon
    externalLinkIcon: true,

    // Outline configuration
    outline: {
      label: 'Auf dieser Seite',
      level: [2, 3]
    },

    // Search configuration with Algolia DocSearch
    search: {
      provider: 'algolia',
      options: {
        appId: 'YOUR_APP_ID',
        apiKey: 'YOUR_SEARCH_API_KEY',
        indexName: 'YOUR_INDEX_NAME',
        searchParameters: {},
        placeholder: 'Dokumentation durchsuchen',
        translations: {
          button: {
            buttonText: 'Suchen',
            buttonAriaLabel: 'Dokumentation durchsuchen'
          },
          modal: {
            searchBox: {
              resetButtonTitle: 'Abfrage löschen',
              resetButtonAriaLabel: 'Abfrage löschen',
              cancelButtonText: 'Abbrechen',
              cancelButtonAriaLabel: 'Abbrechen'
            },
            startScreen: {
              recentSearchesTitle: 'Kürzlich',
              noRecentSearchesText: 'Keine kürzlichen Suchen',
              saveRecentSearchButtonTitle: 'Zu kürzlichen Suchen speichern',
              removeRecentSearchButtonTitle: 'Aus kürzlichen Suchen entfernen',
              favoriteSearchesTitle: 'Favoriten',
              removeFavoriteSearchButtonTitle: 'Aus Favoriten entfernen'
            },
            errorScreen: {
              titleText: 'Ergebnisse konnten nicht abgerufen werden',
              helpText: 'Möglicherweise sollten Sie Ihre Netzwerkverbindung überprüfen.'
            },
            footer: {
              selectText: 'zum Auswählen',
              selectKeyAriaLabel: 'Eingabetaste',
              navigateText: 'zum Navigieren',
              navigateUpKeyAriaLabel: 'Pfeil nach oben',
              navigateDownKeyAriaLabel: 'Pfeil nach unten',
              closeText: 'zum Schließen',
              closeKeyAriaLabel: 'Escape-Taste'
            },
            noResultsScreen: {
              noResultsText: 'Keine Ergebnisse für',
              suggestedQueryText: 'Versuchen Sie zu suchen nach',
              reportMissingResultsText: 'Glauben Sie, dass diese Abfrage Ergebnisse zurückgeben sollte?',
              reportMissingResultsLinkText: 'Lassen Sie es uns wissen.'
            }
          }
        }
      }
    }
  }
})
