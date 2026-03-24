import type { SlidevPreparserExtension } from '@slidev/types'

/**
 * Component tag recognition plugin for Slidev parser.
 * Transforms custom component tags like <ArrayViz :data="[1,2,3]" />
 * into Vue component calls.
 */
export const componentTagPlugin: SlidevPreparserExtension = {
  name: 'algoflow-component-tag',
  async transformSlide(content, _frontmatter) {
    // Match self-closing Vue-style component tags
    // e.g., <ArrayViz :data="[1,2,3]" :steps="steps" />
    return content.replace(
      /<([A-Z]\w*)(\s+[^>]+)?\/>/g,
      (_match, componentName, props) => {
        const propsStr = props?.trim() ?? ''
        return `<Component :is="${componentName}" ${propsStr} />`
      }
    )
  },
}

/**
 * Match component tags with closing tags.
 * e.g., <ArrayViz :data="[1,2,3]">...</ArrayViz>
 */
export const componentTagWithContentPlugin: SlidevPreparserExtension = {
  name: 'algoflow-component-tag-with-content',
  async transformSlide(content, _frontmatter) {
    // Match component tags with content
    return content.replace(
      /<([A-Z]\w*)(\s+[^>]+)?>([\s\S]*?)<\/\1>/g,
      (_match, componentName, props, innerContent) => {
        const propsStr = props?.trim() ?? ''
        return `<Component :is="${componentName}" ${propsStr}>${innerContent}</Component>`
      }
    )
  },
}
