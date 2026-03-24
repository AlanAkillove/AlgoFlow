import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'node:http'
import pc from 'picocolors'

interface PreviewOptions {
  port: string
}

/**
 * Preview animation in a browser.
 */
export function previewCommand(file: string, options: PreviewOptions): void {
  const filePath = path.resolve(file)
  const port = parseInt(options.port, 10)
  
  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.error(pc.red(`Error: File not found: ${filePath}`))
    process.exit(1)
  }
  
  // Read animation file
  let animationContent: string
  try {
    animationContent = fs.readFileSync(filePath, 'utf-8')
  } catch (err) {
    console.error(pc.red(`Error: Failed to read file: ${(err as Error).message}`))
    process.exit(1)
  }
  
  // Parse to get animation type
  let animationData: { type?: string; initialData?: unknown[]; steps?: unknown[] }
  try {
    animationData = JSON.parse(animationContent)
  } catch (err) {
    console.error(pc.red(`Error: Invalid JSON: ${(err as Error).message}`))
    process.exit(1)
  }
  
  const html = generatePreviewHtml(animationData)
  
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
  })
  
  server.listen(port, () => {
    console.log(pc.green(`Preview server running at http://localhost:${port}`))
    console.log(pc.dim('Press Ctrl+C to stop'))
  })
}

/**
 * Generate HTML for preview.
 */
function generatePreviewHtml(data: { type?: string; initialData?: unknown[]; steps?: unknown[] }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AlgoFlow Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f3f4f6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .preview-container {
      width: 100%;
      max-width: 800px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      padding: 20px;
    }
    .title {
      text-align: center;
      margin-bottom: 20px;
      color: #374151;
    }
    .controls {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 20px;
    }
    button {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      background: #3b82f6;
      color: white;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #2563eb; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    #canvas {
      width: 100%;
      height: 400px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="preview-container">
    <h1 class="title">AlgoFlow Preview</h1>
    <canvas id="canvas"></canvas>
    <div class="controls">
      <button id="playBtn">▶ Play</button>
      <button id="prevBtn">⏮ Prev</button>
      <button id="nextBtn">⏭ Next</button>
      <button id="resetBtn">⏹ Reset</button>
    </div>
  </div>
  
  <script type="module">
    // Animation data
    const animationData = ${JSON.stringify(data, null, 2)};
    
    // Simple canvas renderer for preview
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    // Resize canvas
    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      render();
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    // State
    let currentData = [...(animationData.initialData || [])];
    let stepIndex = 0;
    let isPlaying = false;
    const highlighted = new Set();
    
    // Render function
    function render() {
      const width = canvas.getBoundingClientRect().width;
      const height = canvas.getBoundingClientRect().height;
      
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      if (!currentData.length) return;
      
      const n = currentData.length;
      const padding = 20;
      const barWidth = Math.max(4, (width - padding * 2 - (n - 1) * 2) / n);
      const maxVal = Math.max(...currentData, 1);
      
      currentData.forEach((val, i) => {
        const barHeight = (val / maxVal) * (height - padding * 2);
        const x = padding + i * (barWidth + 2);
        const y = height - padding - barHeight;
        
        ctx.fillStyle = highlighted.has(i) ? '#3b82f6' : '#64748b';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
        
        // Value text
        if (barHeight > 20) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(val), x + barWidth / 2, y + 15);
        }
      });
      
      // Update step indicator
      document.getElementById('playBtn').textContent = isPlaying ? '⏸ Pause' : '▶ Play';
    }
    
    // Apply step
    function applyStep(step) {
      const targets = Array.isArray(step.target) ? step.target : [step.target];
      
      switch (step.action) {
        case 'highlight':
          targets.forEach(i => highlighted.add(i));
          break;
        case 'unhighlight':
          targets.forEach(i => highlighted.delete(i));
          break;
        case 'swap':
          if (targets.length === 2) {
            [currentData[targets[0]], currentData[targets[1]]] = 
            [currentData[targets[1]], currentData[targets[0]]];
          }
          break;
        case 'setValue':
          if (targets.length === 1 && step.value !== undefined) {
            currentData[targets[0]] = step.value;
          }
          break;
        case 'complete':
          targets.forEach(i => highlighted.add(i));
          break;
      }
    }
    
    // Controls
    document.getElementById('playBtn').addEventListener('click', async () => {
      if (isPlaying) {
        isPlaying = false;
        return;
      }
      
      isPlaying = true;
      const steps = animationData.steps || [];
      
      while (isPlaying && stepIndex < steps.length) {
        applyStep(steps[stepIndex]);
        render();
        stepIndex++;
        await new Promise(r => setTimeout(r, steps[stepIndex - 1]?.duration || 300));
      }
      
      if (stepIndex >= steps.length) {
        isPlaying = false;
      }
    });
    
    document.getElementById('prevBtn').addEventListener('click', () => {
      isPlaying = false;
      if (stepIndex > 0) {
        stepIndex--;
        // Reset and replay to this step
        currentData = [...(animationData.initialData || [])];
        highlighted.clear();
        for (let i = 0; i <= stepIndex; i++) {
          applyStep(animationData.steps[i]);
        }
        render();
      }
    });
    
    document.getElementById('nextBtn').addEventListener('click', () => {
      isPlaying = false;
      const steps = animationData.steps || [];
      if (stepIndex < steps.length) {
        applyStep(steps[stepIndex]);
        stepIndex++;
        render();
      }
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
      isPlaying = false;
      stepIndex = 0;
      currentData = [...(animationData.initialData || [])];
      highlighted.clear();
      render();
    });
    
    // Initial render
    render();
  </script>
</body>
</html>`
}
