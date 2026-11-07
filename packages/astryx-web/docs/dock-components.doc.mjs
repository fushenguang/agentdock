/** @type {import('@astryxdesign/cli/authoring').ReferenceDoc} */
export default {
  type: 'generic',
  name: 'dock-components',
  title: 'Dock Components',
  description: 'Component selection and layout rules for Astryx and AgentDock pages.',
  sections: [
    {
      title: 'Components',
      content: [
        {
          type: 'list',
          style: 'unordered',
          items: [
            'Use Astryx first: {@command component <Name>}, {@command search <words>}.',
            'Layout uses `Stack`, `Grid`, `Section`, `List`, and the app’s layout primitives, never raw `<div>`s.',
            'Cards are the exception: only for an independently enterable unit (a module entry, a record awaiting a decision), one level deep, never around a form, list, section, or page.',
            'Row actions: the recurring one stays visible; rare or destructive ones go into one end-aligned `MoreMenu` with icon and text. Never three buttons across a row.',
            'Pick the control from the value’s shape: on/off → `Switch`; 2–3 named choices → `SegmentedControl`; 4 or more → `Selector`; a number → `NumberInput`; free text → `TextInput`; an action → `Button`.',
            'No `style` attributes, no hard-coded colors, no viewport media queries.',
          ],
        },
      ],
    },
  ],
}
