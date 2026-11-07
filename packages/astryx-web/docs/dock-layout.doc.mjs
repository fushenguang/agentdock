/** @type {import('@astryxdesign/cli/authoring').ReferenceDoc} */
export default {
  type: 'generic',
  name: 'dock-layout',
  title: 'Dock Layout',
  description: 'Page structure, spacing, reading width, and responsive layout rules.',
  sections: [
    {
      title: 'Layout',
      content: [
        {
          type: 'list',
          style: 'unordered',
          items: [
            'Inline padding 12px below 420px, 20px from 420px. Section gap 16px below 420px, 24px from 420px.',
            'Reading content is capped at 44rem; grids may use 56rem from 960px.',
            'Second-level pages use the one-screen skeleton (`PageShell`): the top bar stays, only the body scrolls.',
            'Vertical first: put secondary detail behind a disclosure, a drawer, a sheet, or a sub-route instead of extending one long scroll.',
            'Never print a title that repeats the navigation; keep a visually hidden `h1` instead.',
          ],
        },
      ],
    },
  ],
}
