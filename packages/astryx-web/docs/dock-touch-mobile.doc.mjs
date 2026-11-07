/** @type {import('@astryxdesign/cli/authoring').ReferenceDoc} */
export default {
  type: 'generic',
  name: 'dock-touch-mobile',
  title: 'Dock Touch Mobile',
  description: 'Touch targets, safe areas, compact navigation, and mobile interaction rules.',
  sections: [
    {
      title: 'Touch and mobile',
      content: [
        {
          type: 'list',
          style: 'unordered',
          items: [
            'Touch targets are at least 44×44px. 32px is allowed only in dense toolbars that never appear on touch screens.',
            'On compact containers, first-level destinations live in the bottom navigation, and the primary action of a flow sits in a bottom bar within thumb reach.',
            'Respect safe areas: `viewport-fit=cover` and `env(safe-area-inset-*)` padding on fixed bars.',
            'Use `100dvh`, not `100vh`.',
            'Inputs use at least a 16px font so iOS does not zoom.',
            'Anything revealed on hover must also work by tap; gate hover styles with `@media (hover: hover)`.',
            'Secondary choices on compact containers open as bottom sheets, not floating menus.',
          ],
        },
      ],
    },
  ],
}
