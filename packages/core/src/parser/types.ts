import type { SourceSlideInfo } from '@slidev/types'

/**
 * Options for parsing Markdown.
 */
export interface ParseOptions {
  /** Custom preparser extensions */
  extensions?: never[]
  /** Disable YAML parsing */
  noParseYAML?: boolean
  /** Preserve carriage returns */
  preserveCR?: boolean
}

/**
 * Parsed slide with additional metadata.
 */
export interface ParsedSlide extends Omit<SourceSlideInfo, 'filepath' | 'index' | 'start' | 'contentStart' | 'end'> {
  /** Component names used in this slide */
  components: string[]
}
