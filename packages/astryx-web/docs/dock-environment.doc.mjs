/** @type {import('@astryxdesign/cli/authoring').ReferenceDoc} */
export default {
  type: 'generic',
  name: 'dock-environment',
  title: 'Dock Environment',
  description: 'The App, WebView, and browser surfaces that every page must support.',
  sections: [
    {
      title: 'Environment',
      content: [
        {
          type: 'list',
          style: 'unordered',
          items: [
            'The same Web runs in three places: the TheFoolAI desktop App, where the package Web is the main surface; the mobile App’s WebView, on a phone with touch; and a standalone browser.',
            'Phone (390×844) and desktop (1440×900) are both first-class design targets. The narrowest supported width is 360px.',
            'Widths come from container queries, not the viewport: below 420px compact, 420–639px standard, 640–959px enhanced, 960px and up wide.',
            'No horizontal scrolling at any width. A wide table becomes key–value rows or a named scrollable region.',
          ],
        },
      ],
    },
  ],
}
