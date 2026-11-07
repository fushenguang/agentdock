/** @type {import('@astryxdesign/cli/authoring').ReferenceDoc} */
export default {
  type: 'generic',
  name: 'dock-refuse-list',
  title: 'Dock Refuse List',
  description: 'Visual and interaction patterns that must never ship.',
  sections: [
    {
      title: 'Refuse list',
      content: [
        {
          type: 'list',
          style: 'dont',
          items: [
            'Gradient text',
            'Glass or blur used as decoration',
            'Neon glow on dark backgrounds',
            'Colored side stripes on cards',
            'Emoji used as icons',
            'Cards inside cards',
            'A page body that is a grid of identical cards',
            'Big-number "hero metrics" on a page that is not a dashboard',
            'Small caps "eyebrow" labels above every heading',
            'Purple-to-blue gradients',
            'Flows that open with a modal (use an inline step, a sheet, or a drawer)',
            'More than one accent color',
            'Reading lines longer than about 75 characters',
            'Centered body paragraphs',
          ],
        },
      ],
    },
  ],
}
