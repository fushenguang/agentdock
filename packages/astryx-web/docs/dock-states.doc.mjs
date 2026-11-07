/** @type {import('@astryxdesign/cli/authoring').ReferenceDoc} */
export default {
  type: 'generic',
  name: 'dock-states',
  title: 'Dock States',
  description: 'Loading, empty, error, disabled, and success state requirements.',
  sections: [
    {
      title: 'States',
      content: [
        {
          type: 'list',
          style: 'unordered',
          items: [
            'Every asynchronous surface has loading, empty, error (readable, with a retry), disabled, and success states.',
            'An empty section is one line of text. `EmptyState` is only for a page whose whole purpose is empty.',
            'A failed save never silently drops the user’s edit.',
          ],
        },
      ],
    },
  ],
}
