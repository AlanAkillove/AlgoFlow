import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import open from 'open'

interface DevOptions {
  port: string
  open: boolean
}

/**
 * Start development server for a Markdown file.
 * Uses Vite dev server for hot reload support.
 */
export function devCommand(file: string, options: DevOptions): void {
  const filePath = path.resolve(file)
  const requestedPort = parseInt(options.port, 10)
  
  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.error(pc.red(`Error: File not found: ${filePath}`))
    process.exit(1)
  }
  
  // Find project root (where package.json is)
  let projectRoot = path.dirname(filePath)
  while (projectRoot !== path.dirname(projectRoot)) {
    if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
      break
    }
    projectRoot = path.dirname(projectRoot)
  }
  
  // Calculate relative path for URL
  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/')
  
  console.log(pc.green(`\n✨ Starting AlgoFlow development server...\n`))
  console.log(pc.dim(`  File:  ${filePath}`))
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
    
    // Debug: log what we received
    // console.log('Received:', JSON.stringify(output))
    
    // Parse actual port from Vite output
    // Vite outputs like: "➜  Local:   http://localhost:3000/"
    // But with ANSI codes: "localhost:\u001b[1m3000\u001b[22m"
    // So we need to strip ANSI codes first
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
    console.error(pc.red(`Failed to start dev server: ${err.message}`))
    process.exit(1)
  })
  
  viteProcess.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(pc.red(`Dev server exited with code ${code}`))
    }
  })
}
