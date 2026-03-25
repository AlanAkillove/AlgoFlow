# AlgoFlow

**ACM Algorithm Visualization & Presentation Tool**

A modern, Markdown-based presentation tool designed for algorithm visualization, built with Vue 3, TypeScript, and Canvas API.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## ✨ Features

### 📝 Markdown-Based Presentations
- Write presentations in pure Markdown
- Automatic slide splitting with `---`
- Frontmatter support for per-slide configuration
- Syntax highlighting with Shiki

### 🎨 Visualization Components
- **ArrayViz** - Array visualization with animation steps
- **TreeViz** - Binary tree and n-ary tree visualization
- **GraphViz** - Graph visualization with force-directed layout
- Use `algoflow` code blocks for clean syntax

### 🎬 Animation System
- Step-by-step algorithm animation
- Highlight, swap, move, and complete actions
- Configurable duration and easing
- Play/pause/seek controls

### 🖌️ Presentation Tools
- **Drawing Mode** - Draw on slides with multiple colors and brush sizes
- **Eraser** - Erase drawings with adjustable size
- **Laser Pointer** - Highlight areas during presentation
- **Speaker Notes** - Add private notes visible only in presenter mode

### 📺 Presenter Mode
- Dual-screen support for presenters
- Slide preview with next slide
- Timer and elapsed time tracking
- Synchronized slide navigation across windows

### 📤 Export Options
- Export to PDF
- Export to PNG images
- Visualization blocks automatically hidden in exports

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `→` / `Space` | Next slide / Next animation step |
| `←` | Previous slide |
| `F` | Toggle fullscreen |
| `D` | Toggle drawing mode |
| `L` | Toggle laser pointer |
| `S` | Toggle speaker notes |
| `P` | Open presenter mode |
| `G` | Toggle thumbnail navigation |
| `shift + /` | Show keyboard hints |
| `Esc` | Close overlays |

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/algoflow.git
cd algoflow

# Install dependencies
pnpm install

# Link CLI globally
pnpm install -g
```

### Create Your First Presentation

```bash
# Create a markdown file
echo "# Hello AlgoFlow\n\nWelcome to algorithm visualization!" > slides/my-presentation.md

# Start the dev server
algoflow slides/my-presentation.md
```

---

## 📖 Usage

### Basic Markdown Syntax

```markdown
---
title: My Presentation
layout: center
---

# Welcome to AlgoFlow

A modern algorithm visualization tool

---

## Features

- Markdown-based slides
- Algorithm visualization
- Export to PDF

---

# Thank You!

Questions?
```

### Visualization with `algoflow` Code Blocks

Use the `algoflow` code block syntax for clean, standard Markdown:

````markdown
```algoflow
{
  "type": "array",
  "data": [5, 2, 8, 1, 9],
  "steps": [
    { "action": "highlight", "target": [0, 1], "duration": 400 },
    { "action": "swap", "target": [0, 1], "duration": 500 },
    { "action": "complete", "target": [0, 1, 2, 3, 4], "duration": 600 }
  ]
}
```
````

### Visualization Types

| Type | Component | Description |
|------|-----------|-------------|
| `array` | ArrayViz | Array visualization with bars |
| `tree` | TreeViz | Binary/n-ary tree visualization |
| `graph` | GraphViz | Graph with force-directed layout |

### Animation Actions

| Action | Target | Description |
|--------|--------|-------------|
| `highlight` | `[index]` or `[i, j]` | Highlight element(s) |
| `unhighlight` | `[index]` or `[i, j]` | Remove highlight |
| `swap` | `[i, j]` | Swap two elements |
| `setValue` | `[index]` | Change element value |
| `complete` | `[indices]` | Mark as sorted/complete |
| `focus` | `[index]` | Focus/zoom on element |

### Speaker Notes

Add speaker notes using HTML comments:

```markdown
## Algorithm Complexity

Time complexity: O(n²)

<!-- notes: Explain why bubble sort is O(n²) in worst case. Mention that it's not practical for large datasets. -->
```

### v-click Animations

Reveal content step by step:

```markdown
## Algorithm Steps

<v-click />

1. Compare adjacent elements

<v-click />

2. Swap if in wrong order

<v-click />

3. Repeat until sorted
```

---

## 🔧 CLI Commands

```bash
# Start dev server
algoflow <file>
algoflow dev <file>
algoflow serve <file>

# Build static HTML
algoflow build <file> -o dist

# Export to PDF
algoflow export <file> -f pdf -o export

# Export to PNG images
algoflow export <file> -f png -o export

# Validate animation JSON
algoflow validate <file>

# Preview animation JSON
algoflow preview <file>
```

### CLI Options

| Option | Description |
|--------|-------------|
| `-p, --port <port>` | Server port (default: 3000) |
| `-o, --output <dir>` | Output directory |
| `-f, --format <format>` | Export format (pdf/png) |
| `--no-open` | Don't open browser automatically |

---

## 🏗️ Project Structure

```
algoflow/
├── packages/
│   ├── core/           # Markdown parsing, rendering, theming
│   ├── animation/      # AnimationPlayer, Canvas renderer
│   ├── visualizations/ # ArrayViz, TreeViz, GraphViz
│   ├── effects/        # Typewriter and other effects
│   └── cli/            # CLI commands
├── src/
│   ├── components/     # Vue components
│   ├── App.vue         # Main application
│   └── main.ts         # Entry point
├── slides/
│   └── examples/       # Example presentations
└── package.json
```

---

## 🎨 Theming

AlgoFlow uses CSS variables for theming:

```css
:root {
  --af-primary: #3b82f6;
  --af-secondary: #8b5cf6;
  --af-success: #22c55e;
  --af-warning: #f59e0b;
  --af-error: #ef4444;
}
```

---

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Build process or tooling changes

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Slidev](https://sli.dev/) - Inspiration for the presentation features
- [Vue.js](https://vuejs.org/) - The progressive JavaScript framework
- [Shiki](https://shiki.style/) - Syntax highlighter
- [Anime.js](https://animejs.com/) - Animation engine
- [D3.js](https://d3js.org/) - Layout algorithms
