#!/usr/bin/env node

import { Command } from 'commander'
import pc from 'picocolors'
import { validateCommand } from './commands/validate'
import { embedCommand } from './commands/embed'
import { previewCommand } from './commands/preview'
import { devCommand } from './commands/dev'
import { buildCommand } from './commands/build'
import { exportCommand } from './commands/export'

const program = new Command()

program
  .name('algoflow')
  .description('AlgoFlow CLI - Algorithm Visualization Presentation Tool')
  .version('0.1.0')
  .usage('[command] [options]')

// ============================================
// Main command: algoflow <file>
// Quick start: just pass a file path
// ============================================
program
  .argument('[file]', 'Markdown file to present')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-o, --open', 'Open browser automatically', true)
  .option('--no-open', 'Do not open browser')
  .action((file, options) => {
    if (file) {
      // If file is provided, start dev server
      devCommand(file, {
        port: options.port,
        open: options.open,
      })
    } else {
      // No file provided, show help
      program.help()
    }
  })

// ============================================
// dev command: Start development server
// ============================================
program
  .command('dev <file>')
  .description('Start development server for a Markdown file')
  .alias('serve')
  .alias('s')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-o, --open', 'Open browser automatically', true)
  .option('--no-open', 'Do not open browser')
  .action((file, options) => {
    devCommand(file, {
      port: options.port,
      open: options.open,
    })
  })

// ============================================
// validate command: Validate animation JSON
// ============================================
program
  .command('validate <file>')
  .description('Validate an animation JSON file against the schema')
  .option('-v, --verbose', 'Show detailed validation errors')
  .action(validateCommand)

// ============================================
// embed command: Embed animation into Markdown
// ============================================
program
  .command('embed')
  .description('Embed animation JSON into a Markdown file')
  .requiredOption('-m, --md <file>', 'Markdown file path')
  .requiredOption('-a, --animation <file>', 'Animation JSON file path')
  .option('-t, --tag <tag>', 'Component tag to replace', '<ArrayViz />')
  .option('-o, --output <file>', 'Output file path (default: overwrite input)')
  .action(embedCommand)

// ============================================
// build command: Build static HTML
// ============================================
program
  .command('build <file>')
  .description('Build static HTML from a Markdown file')
  .alias('b')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .option('--base <path>', 'Base path for URLs', '/')
  .action((file, options) => {
    buildCommand(file, {
      output: options.output,
      base: options.base,
    })
  })

// ============================================
// preview command: Preview animation JSON
// ============================================
program
  .command('preview <file>')
  .description('Preview animation JSON in a browser')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-o, --open', 'Open browser automatically', true)
  .option('--no-open', 'Do not open browser')
  .action(previewCommand)

// ============================================
// export command: Export to PDF/PNG
// ============================================
program
  .command('export <file>')
  .description('Export presentation to PDF or PNG images')
  .alias('e')
  .option('-o, --output <dir>', 'Output directory', 'export')
  .option('-f, --format <format>', 'Export format (pdf or png)', 'pdf')
  .option('-p, --port <port>', 'Dev server port', '3000')
  .action((file, options) => {
    exportCommand(file, {
      output: options.output,
      format: options.format,
      port: options.port,
    })
  })

// ============================================
// Error handling
// ============================================
program.exitOverride((err) => {
  if (err.code === 'commander.help' || err.code === 'commander.version') {
    process.exit(0)
  }
  console.error(pc.red(`Error: ${err.message}`))
  process.exit(1)
})

program.parse()

