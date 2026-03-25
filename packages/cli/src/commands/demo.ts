import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pc from 'picocolors'
import open from 'open'

// ES Module compatible __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface DemoOptions {
  port: string
  open: boolean
}

/**
 * Start the main demo presentation.
 * Opens the built-in main-demo.md file.
 */
export function demoCommand(options: DemoOptions): void {
  // Get the path to main-demo.md (relative to CLI package)
  // CLI is at packages/cli/dist/index.js, demo is at slides/main-demo.md
  const cliDir = __dirname
  const projectRoot = path.resolve(cliDir, '..', '..', '..')
  const demoPath = path.join(projectRoot, 'slides', 'main-demo.md')
  
  // Check if demo file exists
  if (!fs.existsSync(demoPath)) {
    console.error(pc.red(`Error: Demo file not found: ${demoPath}`))
    console.log(pc.yellow('Please make sure you are running from the AlgoFlow project directory.'))
    process.exit(1)
  }
  
  const requestedPort = parseInt(options.port, 10)
  const relativePath = 'slides/main-demo.md'
  
  console.log(pc.green(`\n🎯 Starting AlgoFlow Main Demo...\n`))
  console.log(pc.dim(`  File:  ${demoPath}`))
  console.log(pc.dim(`  Root:  ${projectRoot}`))
  
  // Run Vite dev server
  const viteProcess = spawn('pnpm', ['dev', '--port', String(requestedPort)], {
    cwd: projectRoot,
    stdio: ['inherit', 'pipe', 'inherit'],
    shell: true,
  })
  
  let actualPort = requestedPort
  let serverReady = false
  
  // Parse Vite output to find actual port
  viteProcess.stdout?.on('data', (data: Buffer) => {
    const output = data.toString()
    process.stdout.write(data)
    
    // Parse actual port from Vite output
    const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '')
    const portMatch = cleanOutput.match(/localhost:(\d+)/)
    if (portMatch && !serverReady) {
      actualPort = parseInt(portMatch[1], 10)
      serverReady = true
      
      const url = `http://localhost:${actualPort}?file=${encodeURIComponent(relativePath)}`
      console.log(pc.cyan(`\n  📝 Open in browser: ${url}\n`))
      
      // Open browser if requested
      if (options.open) {
        setTimeout(async () => {
          try {
            await open(url)
          } catch {
            console.log(pc.yellow(`Could not open browser. Please open the URL above manually.`))
          }
        }, 500)
      }
    }
  })
  
  viteProcess.on('error', (err) => {
    console.error(pc.red(`Failed to start demo server: ${err.message}`))
    process.exit(1)
  })
  
  viteProcess.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(pc.red(`Demo server exited with code ${code}`))
    }
  })
}
