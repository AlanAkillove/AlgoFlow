# AlgoFlow

**ACM 算法可视化演示工具**

一个现代化的、基于 Markdown 的演示工具，专为算法可视化设计，使用 Vue 3、TypeScript 和 Canvas API 构建。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## ✨ 功能特性

### 📝 基于 Markdown 的演示文稿
- 使用纯 Markdown 编写演示文稿
- 使用 `---` 自动分割幻灯片
- 支持 frontmatter 进行每页配置
- 使用 Shiki 进行语法高亮

### 🎨 可视化组件
- **ArrayViz** - 数组可视化，支持动画步骤
- **TreeViz** - 二叉树和多叉树可视化
- **GraphViz** - 图可视化，支持力导向布局
- 使用 `algoflow` 代码块，语法简洁

### 🎬 动画系统
- 逐步算法动画演示
- 支持高亮、交换、移动、完成等动作
- 可配置持续时间和缓动效果
- 播放/暂停/跳转控制

### 🖌️ 演示工具
- **画笔模式** - 多种颜色和画笔大小在幻灯片上绘制
- **橡皮擦** - 可调节大小的擦除功能
- **激光笔** - 演示时高亮区域
- **演讲者备注** - 仅在演讲者模式可见的私密备注

### 📺 演讲者模式
- 双屏支持，适合演讲者使用
- 当前幻灯片预览和下一页预览
- 计时器和已用时间追踪
- 跨窗口同步幻灯片导航

### 📤 导出选项
- 导出为 PDF
- 导出为 PNG 图片
- 导出时自动隐藏可视化代码块

### ⌨️ 键盘快捷键
| 按键 | 功能 |
|-----|------|
| `→` / `空格` | 下一页 / 下一步动画 |
| `←` | 上一页 |
| `F` | 切换全屏 |
| `D` | 切换画笔模式 |
| `L` | 切换激光笔 |
| `S` | 切换演讲者备注 |
| `P` | 打开演讲者模式 |
| `G` | 切换缩略图导航 |
| `shift + /` | 显示键盘提示 |
| `Esc` | 关闭弹窗 |

---

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/algoflow.git
cd algoflow

# 安装依赖
pnpm install

# 全局链接 CLI
pnpm install -g
```

### 创建第一个演示文稿

```bash
# 创建 Markdown 文件
echo "# 你好 AlgoFlow\n\n欢迎使用算法可视化工具！" > slides/my-presentation.md

# 启动开发服务器
algoflow slides/my-presentation.md
```

---

## 📖 使用指南

### 基本 Markdown 语法

```markdown
---
title: 我的演示文稿
layout: center
---

# 欢迎使用 AlgoFlow

现代化的算法可视化工具

---

## 功能特性

- 基于 Markdown 的幻灯片
- 算法可视化
- 导出为 PDF

---

# 谢谢观看！

有问题吗？
```

### 使用 `algoflow` 代码块进行可视化

使用 `algoflow` 代码块语法，保持 Markdown 的纯净性：

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

### 可视化类型

| 类型 | 组件 | 描述 |
|------|------|------|
| `array` | ArrayViz | 数组可视化（柱状图） |
| `tree` | TreeViz | 二叉树/多叉树可视化 |
| `graph` | GraphViz | 图可视化（力导向布局） |

### 动画动作

| 动作 | 目标 | 描述 |
|------|------|------|
| `highlight` | `[索引]` 或 `[i, j]` | 高亮元素 |
| `unhighlight` | `[索引]` 或 `[i, j]` | 取消高亮 |
| `swap` | `[i, j]` | 交换两个元素 |
| `setValue` | `[索引]` | 修改元素值 |
| `complete` | `[索引数组]` | 标记为已排序/完成 |
| `focus` | `[索引]` | 聚焦/缩放到元素 |

### 演讲者备注

使用 HTML 注释添加演讲者备注：

```markdown
## 算法复杂度

时间复杂度：O(n²)

<!-- notes: 解释为什么冒泡排序在最坏情况下是 O(n²)。提到它不适用于大数据集。 -->
```

### v-click 点击动画

逐步显示内容：

```markdown
## 算法步骤

<v-click />

1. 比较相邻元素

<v-click />

2. 如果顺序错误则交换

<v-click />

3. 重复直到排序完成
```

---

## 🔧 CLI 命令

```bash
# 启动开发服务器
algoflow <文件>
algoflow dev <文件>
algoflow serve <文件>

# 构建静态 HTML
algoflow build <文件> -o dist

# 导出为 PDF
algoflow export <文件> -f pdf -o export

# 导出为 PNG 图片
algoflow export <文件> -f png -o export

# 验证动画 JSON
algoflow validate <文件>

# 预览动画 JSON
algoflow preview <文件>
```

### CLI 选项

| 选项 | 描述 |
|------|------|
| `-p, --port <端口>` | 服务器端口（默认：3000） |
| `-o, --output <目录>` | 输出目录 |
| `-f, --format <格式>` | 导出格式（pdf/png） |
| `--no-open` | 不自动打开浏览器 |

---

## 🏗️ 项目结构

```
algoflow/
├── packages/
│   ├── core/           # Markdown 解析、渲染、主题
│   ├── animation/      # 动画播放器、Canvas 渲染器
│   ├── visualizations/ # ArrayViz、TreeViz、GraphViz
│   ├── effects/        # 打字机效果等
│   └── cli/            # CLI 命令
├── src/
│   ├── components/     # Vue 组件
│   ├── App.vue         # 主应用
│   └── main.ts         # 入口文件
├── slides/
│   └── examples/       # 示例演示文稿
└── package.json
```

---

## 🎨 主题定制

AlgoFlow 使用 CSS 变量进行主题定制：

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

## 🛠️ 开发指南

```bash
# 安装依赖
pnpm install

# 启动开发模式
pnpm dev

# 构建所有包
pnpm build

# 运行代码检查
pnpm lint
```

---

## 🤝 贡献指南

欢迎贡献代码！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

### 提交规范

本项目遵循 [约定式提交](https://www.conventionalcommits.org/zh-hans/)：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更改
- `style`: 代码风格更改
- `refactor`: 代码重构
- `test`: 添加/更新测试
- `chore`: 构建过程或工具更改

---

## 📄 许可证

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- [Slidev](https://sli.dev/) - 演示功能的灵感来源
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Shiki](https://shiki.style/) - 语法高亮器
- [Anime.js](https://animejs.com/) - 动画引擎
- [D3.js](https://d3js.org/) - 布局算法
