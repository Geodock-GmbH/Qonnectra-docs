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
  title: 'Qonnectra Documentation',
  description: 'Network documentation for municipal infrastructures - Manual and best practices',

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

  // Internationalization configuration
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      title: 'Qonnectra Documentation',
      description: 'Network documentation for municipal infrastructures - Manual and best practices',
      themeConfig: {
        // Site navigation
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Manual', link: '/manual/' },
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
          message: 'Open source software for municipal network documentation. Licensed under AGPL-3.0.',
          copyright: 'Copyright © 2025 Geodock GmbH'
        },

        // Edit link
        editLink: {
          pattern: 'https://github.com/Geodock-GmbH/Qonnectra/edit/main/docs/:path',
          text: 'Edit this page on GitHub'
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
              root: {
                placeholder: 'Search documentation',
                translations: {
                  button: {
                    buttonText: 'Search',
                    buttonAriaLabel: 'Search documentation'
                  },
                  modal: {
                    searchBox: {
                      resetButtonTitle: 'Clear the query',
                      resetButtonAriaLabel: 'Clear the query',
                      cancelButtonText: 'Cancel',
                      cancelButtonAriaLabel: 'Cancel'
                    },
                    startScreen: {
                      recentSearchesTitle: 'Recent',
                      noRecentSearchesText: 'No recent searches',
                      saveRecentSearchButtonTitle: 'Save to recent searches',
                      removeRecentSearchButtonTitle: 'Remove from recent searches',
                      favoriteSearchesTitle: 'Favorite',
                      removeFavoriteSearchButtonTitle: 'Remove from favorites'
                    },
                    errorScreen: {
                      titleText: 'Unable to fetch results',
                      helpText: 'You might want to check your network connection.'
                    },
                    footer: {
                      selectText: 'to select',
                      selectKeyAriaLabel: 'Enter key',
                      navigateText: 'to navigate',
                      navigateUpKeyAriaLabel: 'Arrow up',
                      navigateDownKeyAriaLabel: 'Arrow down',
                      closeText: 'to close',
                      closeKeyAriaLabel: 'Escape key'
                    },
                    noResultsScreen: {
                      noResultsText: 'No results for',
                      suggestedQueryText: 'Try searching for',
                      reportMissingResultsText: 'Believe this query should return results?',
                      reportMissingResultsLinkText: 'Let us know.'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    de: {
      label: 'Deutsch',
      lang: 'de',
      title: 'Qonnectra Dokumentation',
      description: 'Netzdokumentation für kommunale Infrastrukturen - Handbuch und Best Practices',
      themeConfig: {
        // Site navigation
        nav: [
          { text: 'Startseite', link: '/de/' },
          { text: 'Handbuch', link: '/de/manual/' },
          { text: 'Best Practices', link: '/de/best-practices/' },
          { text: 'Website', link: 'https://qonnectra.de', target: '_blank' }
        ],

        // Sidebar navigation - auto-generated from file structure
        sidebar: generateSidebar([
          generateSidebarConfig('de/manual'),
          generateSidebarConfig('de/best-practices'),
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
    }
  }
})
