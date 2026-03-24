import fs from 'node:fs'
import path from 'node:path'
import pc from 'picocolors'

interface BuildOptions {
  output: string
  base: string
}

/**
 * Build static HTML from a Markdown file.
 */
export function buildCommand(file: string, options: BuildOptions): void {
  const filePath = path.resolve(file)
  const outputDir = path.resolve(options.output || 'dist')
  
  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.error(pc.red(`Error: File not found: ${filePath}`))
    process.exit(1)
  }
  
  console.log(pc.green(`\n📦 Building AlgoFlow presentation...\n`))
  console.log(pc.dim(`  Input:  ${filePath}`))
  console.log(pc.dim(`  Output: ${outputDir}`))
  
  // Find project root
  let projectRoot = path.dirname(filePath)
  while (projectRoot !== path.dirname(projectRoot)) {
    if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
      break
    }
    projectRoot = path.dirname(projectRoot)
  }
  
  // Read slide content
  let slideContent: string
  try {
    slideContent = fs.readFileSync(filePath, 'utf-8')
  } catch (err) {
    console.error(pc.red(`Error reading file: ${(err as Error).message}`))
    process.exit(1)
  }
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  // Copy slide file
  const slideFileName = path.basename(filePath)
  fs.copyFileSync(filePath, path.join(outputDir, slideFileName))
  
  // Generate index.html
  const html = generateStaticHtml(slideFileName, slideContent, options.base)
  fs.writeFileSync(path.join(outputDir, 'index.html'), html)
  
  // Copy assets from project
  const assetsDir = path.join(projectRoot, 'public')
  if (fs.existsSync(assetsDir)) {
    copyDir(assetsDir, path.join(outputDir, 'public'))
  }
  
  console.log(pc.green(`\n✅ Build complete!\n`))
  console.log(pc.dim(`  Open ${path.join(outputDir, 'index.html')} in a browser to view.\n`))
}

/**
 * Generate static HTML.
 */
function generateStaticHtml(slideFile: string, _slideContent: string, base: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AlgoFlow Presentation</title>
  <base href="${base}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #app {
      height: 100%;
      width: 100%;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
    }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #94a3b8;
      font-size: 18px;
    }
    .loading::after {
      content: '';
      width: 20px;
      height: 20px;
      margin-left: 12px;
      border: 2px solid #3b82f6;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="loading">Loading presentation...</div>
  </div>
  
  <!-- Static build - loads slide from embedded data -->
  <script type="module">
    // In a real implementation, this would load the bundled app
    // For now, we just redirect to the markdown file
    const slidePath = './${slideFile}';
    
    async function init() {
      const response = await fetch(slidePath);
      const markdown = await response.text();
      
      // Store for app to read
      sessionStorage.setItem('algoflow-slide', markdown);
      
      // In production, this would be a bundled Vue app
      document.getElementById('app').innerHTML = \`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #e2e8f0; background: #0f172a; padding: 40px; text-align: center;">
          <h1 style="font-size: 24px; margin-bottom: 16px;">📄 Static Build</h1>
          <p style="color: #94a3b8; max-width: 500px;">
            This is a static export. For full functionality, use the development server:
          </p>
          <code style="margin-top: 20px; padding: 12px 20px; background: #1e293b; border-radius: 8px; color: #3b82f6;">
            algoflow dev ${slideFile}
          </code>
        </div>
      \`;
    }
    
    init().catch(err => {
      document.getElementById('app').innerHTML = \`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ef4444;">
          <h1>⚠️ Error</h1>
          <p style="margin-top: 12px; color: #64748b;">\${err.message}</p>
        </div>
      \`;
    });
  </script>
</body>
</html>`
}

/**
 * Copy directory recursively.
 */
function copyDir(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}
