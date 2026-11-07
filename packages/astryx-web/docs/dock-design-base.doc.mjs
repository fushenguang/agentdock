/** @type {import('@astryxdesign/cli/authoring').ReferenceDoc} */
export default {
  type: 'generic',
  name: 'dock-design-base',
  title: 'Dock Design Base',
  description:
    'The product, layout, interaction, content, state, accessibility, and acceptance rules for AgentDock web pages.',
  sections: [
    {
      title: 'Read the design base',
      content: [
        {
          type: 'prose',
          text: 'Read these sections before UI work. They apply to the same Web in the desktop App, the mobile App WebView, and a standalone browser.',
        },
        {
          type: 'list',
          style: 'unordered',
          items: [
            '{@link generic:dock-product-stance}',
            '{@link generic:dock-environment}',
            '{@link generic:dock-layout}',
            '{@link generic:dock-touch-mobile}',
            '{@link generic:dock-components}',
            '{@link generic:dock-copy}',
            '{@link generic:dock-states}',
            '{@link generic:dock-accessibility}',
            '{@link generic:dock-refuse-list}',
            '{@link generic:dock-visual-acceptance}',
          ],
        },
      ],
    },
  ],
}
