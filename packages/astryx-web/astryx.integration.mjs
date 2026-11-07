/** @type {import('@astryxdesign/cli/authoring').AstryxIntegration} */
export default {
  docs: './docs',
  templates: './templates',

  agentDocs: {
    append: [
      'Create every page from a template. Put the page type last: write "mobile settings page", not "settings page on mobile".',
      'Prefer the dock-* archetypes; when you know the one you need, run astryx template <id> directly.',
      'Read astryx docs dock-design-base before UI work. Phone (390px) and desktop (1440px) are both first-class; touch targets are at least 44px.',
      'Keep every string in the app catalogs, every color a token, every breakpoint a container query; no style attributes and no viewport media queries.',
      'Before calling UI work done, render it at 390x844 and 1440x900 in light and dark and check it against astryx docs dock-visual-acceptance.',
    ],
  },
}
