/** @type {import('@astryxdesign/cli/authoring').ReferenceDoc} */
export default {
  type: 'generic',
  name: 'dock-visual-acceptance',
  title: 'Dock Visual Acceptance',
  description: 'The render matrix and visual review rules for UI work.',
  sections: [
    {
      title: 'Visual acceptance',
      content: [
        {
          type: 'list',
          style: 'unordered',
          items: [
            'Render the changed pages at 390×844 and 1440×900, in light and dark.',
            'Check them against A1–A9. Fix everything you find in one batch. At most two rounds, then hand over.',
            'Screenshots are for judging what the user sees. Never use them to watch CI, pipelines, or progress; read the API.',
          ],
        },
      ],
    },
  ],
}
