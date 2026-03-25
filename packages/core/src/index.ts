/**
 * @algoflow/core
 * 
 * Core module for AlgoFlow - handles Markdown parsing and theming.
 */

// Parser exports
export { parseMarkdown, parseSlide } from './parser/index'
export { componentTagPlugin, componentTagWithContentPlugin } from './parser/component-tag'
export type { ParsedSlide, ParseOptions } from './parser/types';

// Directive exports
export {
  parseDirectives,
  getAnimationConfig,
  getTransitionConfig,
  layoutToStyles,
  ANIMATION_PRESETS,
  TRANSITION_PRESETS,
} from './parser/directives'
export type {
  LayoutConfig,
  AnimationConfig,
  TransitionConfig,
  SlideDirectives,
} from './parser/directives'

// Theme exports
// Theme exports (re-exporting for tsup)
export { applyTheme, createTheme, lightTheme, darkTheme, sepiaTheme } from './theme/index';
export type { Theme, ThemeColors } from './theme/types';

// Plugin exports
export { PluginManager, pluginManager, usePlugin, removePlugin } from './plugin/index'
export type {
  AlgoFlowPlugin,
  PluginOptions,
  PluginRegistrationResult,
  MarkdownExtension,
  PluginCommand,
  SlideInfo as PluginSlideInfo,
} from './plugin/types'
