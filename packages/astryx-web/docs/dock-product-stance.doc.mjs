/** @type {import('@astryxdesign/cli/authoring').ReferenceDoc} */
export default {
  type: 'generic',
  name: 'dock-product-stance',
  title: 'Dock Product Stance',
  description: 'Product rules that keep every page focused on the user’s next action.',
  sections: [
    {
      title: 'Product stance',
      content: [
        {
          type: 'list',
          style: 'unordered',
          items: [
            'One page, one job. A first-level route is an index; the work happens one route deeper.',
            'Hierarchy over decoration. Headings, dividers, and spacing carry structure; borders, shadows, and card chrome are exceptions.',
            'The first screen answers "what do I do now" with a control, not a paragraph.',
            'Fewer, larger surfaces. If a page reads as a wall of boxes, remove boxes.',
            'Every label, counter, and tip must earn its line.',
          ],
        },
      ],
    },
  ],
}
