import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'
import { VitePressSidebarOptions } from 'vitepress-sidebar/types'

function generateSidebarConfig(path: string, override: Partial<VitePressSidebarOptions> = {}) {
  return {
    scanStartPath: path,
    resolvePath: `/${path}/`,
    useTitleFromFileHeading: true,
    useTitleFromFrontmatter: true,
    useFolderTitleFromIndexFile: true,
    includeRootIndexFile: true,
    includeFolderIndexFile: true,
    collapsed: false,
    ...override,
  }
}

export default defineConfig({
  title: 'Qonnectra Dokumentation',
  description: 'Netzdokumentation für kommunale Infrastrukturen - Handbuch und Best Practices',
  lang: 'de',

  // Base URL for GitHub Pages deployment
  base: '/qonnectra/',

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
    // Site navigation
    nav: [
      { text: 'Startseite', link: '/' },
      { text: 'Handbuch', link: '/manual/' },
      { text: 'Best Practices', link: '/best-practices/' },
      { text: 'Website', link: 'https://qonnectra.de', target: '_blank' }
    ],

    // Sidebar navigation - auto-generated from file structure
    sidebar: generateSidebar([
      generateSidebarConfig('manual'),
      generateSidebarConfig('best-practices')
    ]),

    // Footer
    footer: {
      message: 'Open-Source-Software für kommunale Netzdokumentation. Lizenziert unter AGPL-3.0.',
      copyright: 'Copyright © 2025 Geodock GmbH'
    },

    // Edit link
    editLink: {
      pattern: 'https://github.com/Geodock-GmbH/Qonnectra/edit/main/docs/:path',
      text: 'Diese Seite auf GitHub bearbeiten'
    },

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Geodock-GmbH/Qonnectra' }
    ],

    // External link icon
    externalLinkIcon: true,

    // Search configuration with Algolia DocSearch
    search: {
      provider: 'algolia',
      options: {
        appId: 'YOUR_APP_ID',
        apiKey: 'YOUR_SEARCH_API_KEY',
        indexName: 'YOUR_INDEX_NAME',
        searchParameters: {},
        locales: {
          de: {
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
    }
  }
})
