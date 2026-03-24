/**
 * @algoflow/core
 * 
 * Core module for AlgoFlow - handles Markdown parsing and theming.
 */

// Parser exports
export { parseMarkdown, parseSlide } from './parser/index'
export { componentTagPlugin, componentTagWithContentPlugin } from './parser/component-tag'
export type { ParsedSlide, ParseOptions } from './parser/types';

// Theme exports
// Theme exports (re-exporting for tsup)
export { applyTheme, createTheme, lightTheme, darkTheme, sepiaTheme } from './theme/index';
export type { Theme, ThemeColors } from './theme/types';
