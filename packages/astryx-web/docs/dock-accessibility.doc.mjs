/** @type {import('@astryxdesign/cli/authoring').ReferenceDoc} */
export default {
  type: 'generic',
  name: 'dock-accessibility',
  title: 'Dock Accessibility',
  description: 'Heading, focus, status, and contrast requirements for every page.',
  sections: [
    {
      title: 'Accessibility',
      content: [
        {
          type: 'list',
          style: 'unordered',
          items: [
            'Exactly one `h1` per page (visually hidden when it would repeat navigation); headings in order.',
            'Visible focus on every control; every action reachable by keyboard.',
            'Status is never color-only.',
            'Contrast at least 4.5:1 for body text and 3:1 for large text and controls.',
          ],
        },
      ],
    },
  ],
}
