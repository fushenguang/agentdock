/** @type {import('@astryxdesign/cli/authoring').ReferenceDoc} */
export default {
  type: 'generic',
  name: 'dock-copy',
  title: 'Dock Copy',
  description: 'Catalog, naming, and concision rules for user-facing text.',
  sections: [
    {
      title: 'Copy',
      content: [
        {
          type: 'list',
          style: 'unordered',
          items: [
            'Every user-facing string lives in the app catalogs, with the same keys in every locale.',
            'Delete paragraphs that only introduce a section. Keep the one line attached to a thing: a value’s status, a field’s format rule, an option’s description.',
            'Name things by what they do, not by the technology behind them.',
          ],
        },
      ],
    },
  ],
}
