import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'
import { chromium, type Browser } from 'playwright'

interface ExportOptions {
  output: string
  format: 'pdf' | 'png'
  port: number
}

/**
 * Export presentation to PDF or PNG.
 */
export async function exportCommand(file: string, options: ExportOptions): Promise<void> {
  const filePath = path.resolve(file)
  const outputDir = path.resolve(options.output || 'export')
  const format = options.format || 'pdf'
  
  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.error(pc.red(`Error: File not found: ${filePath}`))
    process.exit(1)
  }
  
  console.log(pc.green(`\n📤 Exporting AlgoFlow presentation...\n`))
  console.log(pc.dim(`  Input:  ${filePath}`))
  console.log(pc.dim(`  Output: ${outputDir}`))
  console.log(pc.dim(`  Format: ${format.toUpperCase()}`))
  
  // Find project root
  let projectRoot = path.dirname(filePath)
  while (projectRoot !== path.dirname(projectRoot)) {
    if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
      break
    }
    projectRoot = path.dirname(projectRoot)
  }
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  let browser: Browser | null = null
  
  try {
    // Launch browser
    console.log(pc.dim('\n  Launching browser...'))
    browser = await chromium.launch()
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    })
    
    const page = await context.newPage()
    
    // Start dev server or use existing
    const port = options.port || 3000
    const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/')
    const url = `http://localhost:${port}?file=${encodeURIComponent(relativePath)}&export=pdf`
    
    console.log(pc.dim(`  Opening ${url}...`))
    
    // Navigate to the presentation
    await page.goto(url, { waitUntil: 'networkidle' })
    
    // Wait for slides to load
    await page.waitForSelector('.slide-renderer', { timeout: 30000 })
    await page.waitForTimeout(1000) // Additional wait for animations
    
    // Get total slides
    const totalSlides = await page.evaluate(() => {
      // @ts-ignore - runs in browser context
      const app = document.querySelector('.algoflow-app')
      if (!app) return 0
      // Try to get from Vue app state
      const slideCount = app.querySelectorAll('.slide-renderer').length
      return slideCount || 1
    })
    
    console.log(pc.dim(`  Found ${totalSlides} slide(s)`))
    
    // Export each slide
    for (let i = 0; i < totalSlides; i++) {
      console.log(pc.dim(`  Exporting slide ${i + 1}/${totalSlides}...`))
      
      // Navigate to slide
      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(500) // Wait for transition
      }
      
      // Hide navigation for cleaner export
      await page.evaluate(() => {
        // @ts-ignore - runs in browser context
        const nav = document.querySelector('.slide-nav')
        // @ts-ignore - runs in browser context
        if (nav) nav.style.display = 'none'
      })
      
      const outputPath = path.join(outputDir, `slide-${String(i + 1).padStart(2, '0')}`)
      
      if (format === 'pdf') {
        await page.pdf({
          path: `${outputPath}.pdf`,
          width: '1920px',
          height: '1080px',
          printBackground: true
        })
      } else {
        await page.screenshot({
          path: `${outputPath}.png`,
          fullPage: false
        })
      }
      
      // Restore navigation
      await page.evaluate(() => {
        // @ts-ignore - runs in browser context
        const nav = document.querySelector('.slide-nav')
        // @ts-ignore - runs in browser context
        if (nav) nav.style.display = ''
      })
    }
    
    console.log(pc.green(`\n✅ Export complete!\n`))
    console.log(pc.dim(`  Files saved to: ${outputDir}\n`))
    
  } catch (err) {
    console.error(pc.red(`\nError during export: ${(err as Error).message}`))
    
    if ((err as Error).message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.log(pc.yellow('\n  Tip: Make sure the dev server is running:'))
      console.log(pc.dim(`    algoflow dev ${file}`))
    }
    
    process.exit(1)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
