---
title: AlgoFlow 完整功能演示
layout: center
---

# 🎯 AlgoFlow

## ACM 算法可视化演示工具

让算法教学变得生动有趣

---

# 📖 项目简介

AlgoFlow 是一个专为 ACM 算法学习和教学设计的可视化演示工具：

- **📊 可视化组件** - 支持 8 种数据结构可视化
- **🎬 动画引擎** - 流畅的步骤动画演示
- **📝 Markdown 驱动** - 简单易用的演示文稿语法
- **🎨 主题定制** - 支持亮色/暗色主题切换
- **🖌️ 演示工具** - 画笔、激光笔、演讲者模式

---

# 🧩 可视化组件一览

| 组件 | 用途 | 数据结构 |
|------|------|----------|
| ArrayViz | 数组可视化 | 线性表 |
| StackViz | 栈可视化 | LIFO |
| QueueViz | 队列可视化 | FIFO |
| HeapViz | 堆可视化 | 完全二叉树 |
| TreeViz | 树可视化 | 通用树 |
| BSTViz | 二叉搜索树 | BST |
| GraphViz | 图可视化 | 图结构 |
| SortingViz | 排序可视化 | 排序算法 |

---

# 1️⃣ 数组可视化 ArrayViz

数组是最基础的数据结构，支持元素的比较、交换和高亮操作。

<ArrayViz
  :data="[64, 34, 25, 12, 22, 11, 90, 5, 77]"
  :show-values="true"
  :show-indices="true"
/>

---

## ArrayViz 带动画演示

<ArrayViz
  :data="[5, 3, 8, 4, 2]"
  :steps="[
    { action: 'compare', target: [0, 1], duration: 500, description: '比较 5 和 3' },
    { action: 'swap', target: [0, 1], duration: 400, description: '交换 → [3, 5, 8, 4, 2]' },
    { action: 'compare', target: [1, 2], duration: 500, description: '比较 5 和 8' },
    { action: 'compare', target: [2, 3], duration: 500, description: '比较 8 和 4' },
    { action: 'swap', target: [2, 3], duration: 400, description: '交换 → [3, 5, 4, 8, 2]' },
    { action: 'complete', target: [3], duration: 300, description: '最大值就位！' }
  ]"
/>

使用播放控制按钮体验动画效果 →

---

# 2️⃣ 栈可视化 StackViz

栈是一种 **后进先出 (LIFO)** 的数据结构。

<v-click />

基本操作：
- **push** - 元素入栈
- **pop** - 元素出栈  
- **peek** - 查看栈顶

<v-click />

<StackViz
  :data="[10, 20, 30, 40]"
  :show-pointers="true"
/>

---

## StackViz 动画演示

<StackViz
  :data="[1, 2, 3]"
  :steps="[
    { action: 'highlight', target: 2, description: '栈顶元素: 3' },
    { action: 'push', target: 3, value: 4, description: 'Push 4' },
    { action: 'push', target: 4, value: 5, description: 'Push 5' },
    { action: 'pop', target: 4, description: 'Pop 5' },
    { action: 'complete', target: [0, 1, 2, 3], description: '最终栈: [1, 2, 3, 4]' }
  ]"
/>

---

# 3️⃣ 队列可视化 QueueViz

队列是一种 **先进先出 (FIFO)** 的数据结构。

<v-click />

基本操作：
- **enqueue** - 元素入队
- **dequeue** - 元素出队

<v-click />

<QueueViz
  :data="[1, 2, 3, 4, 5]"
  :show-pointers="true"
/>

---

## QueueViz 动画演示

<QueueViz
  :data="[10, 20, 30]"
  :steps="[
    { action: 'highlight', target: 0, description: 'FRONT: 10' },
    { action: 'highlight', target: 2, description: 'REAR: 30' },
    { action: 'enqueue', target: 3, value: 40, description: 'Enqueue 40' },
    { action: 'dequeue', target: 0, description: 'Dequeue 10' },
    { action: 'complete', target: [0, 1, 2], description: '最终队列: [20, 30, 40]' }
  ]"
/>

---

# 4️⃣ 堆可视化 HeapViz

堆是一种特殊的完全二叉树，常用于优先队列。

<v-click />

- **最大堆** - 父节点 ≥ 子节点
- **最小堆** - 父节点 ≤ 子节点

<v-click />

<HeapViz
  :data="[16, 14, 10, 8, 7, 9, 3, 2, 4, 1]"
  :heap-type="'max'"
/>

---

## HeapViz 动画演示

<HeapViz
  :data="[50, 30, 40, 10, 20, 35, 25]"
  :heap-type="'max'"
  :steps="[
    { action: 'highlight', target: 0, description: '根节点: 50' },
    { action: 'compare', target: [0, 1], description: '左子节点: 30 < 50 ✓' },
    { action: 'compare', target: [0, 2], description: '右子节点: 40 < 50 ✓' },
    { action: 'complete', target: [0, 1, 2, 3, 4, 5, 6], description: '最大堆性质满足！' }
  ]"
/>

---

# 5️⃣ 树可视化 TreeViz

支持通用树结构的可视化展示。

<TreeViz
  :data="[
    {
      id: 'root',
      value: 'A',
      children: [
        {
          id: 'b',
          value: 'B',
          children: [
            { id: 'd', value: 'D', children: [] },
            { id: 'e', value: 'E', children: [] }
          ]
        },
        {
          id: 'c',
          value: 'C',
          children: [
            { id: 'f', value: 'F', children: [] }
          ]
        }
      ]
    }
  ]"
/>

---

## TreeViz - 二叉搜索树示例

<TreeViz
  :data="[
    {
      id: 'root',
      value: 50,
      children: [
        {
          id: 'l1',
          value: 30,
          children: [
            { id: 'l2', value: 20, children: [] },
            { id: 'r2', value: 40, children: [] }
          ]
        },
        {
          id: 'r1',
          value: 70,
          children: [
            { id: 'l3', value: 60, children: [] },
            { id: 'r3', value: 80, children: [] }
          ]
        }
      ]
    }
  ]"
/>

中序遍历: 20 → 30 → 40 → 50 → 60 → 70 → 80

---

# 6️⃣ 二叉搜索树 BSTViz

自动构建和演示 BST 操作。

<BSTViz
  :data="[50, 30, 70, 20, 40, 60, 80, 10, 25, 35, 45]"
/>

<v-click />

特性：
- 左子树 < 根节点 < 右子树
- 查找、插入、删除: **O(log n)** 平均

---

# 7️⃣ 图可视化 GraphViz

支持有向图、无向图、带权图的可视化。

<GraphViz
  :nodes="[
    { id: 'A', value: 'A' },
    { id: 'B', value: 'B' },
    { id: 'C', value: 'C' },
    { id: 'D', value: 'D' },
    { id: 'E', value: 'E' },
    { id: 'F', value: 'F' }
  ]"
  :edges="[
    { source: 'A', target: 'B', weight: 2 },
    { source: 'A', target: 'C', weight: 4 },
    { source: 'B', target: 'D', weight: 3 },
    { source: 'C', target: 'D', weight: 1 },
    { source: 'D', target: 'E', weight: 5 },
    { source: 'B', target: 'F', weight: 2 },
    { source: 'E', target: 'F', weight: 1 }
  ]"
/>

---

## GraphViz - 无向图示例

<GraphViz
  :nodes="[
    { id: '1', value: '1' },
    { id: '2', value: '2' },
    { id: '3', value: '3' },
    { id: '4', value: '4' },
    { id: '5', value: '5' }
  ]"
  :edges="[
    { source: '1', target: '2' },
    { source: '1', target: '3' },
    { source: '2', target: '3' },
    { source: '2', target: '4' },
    { source: '3', target: '4' },
    { source: '4', target: '5' }
  ]"
/>

常用算法：BFS、DFS、Dijkstra、Floyd-Warshall

---

# 8️⃣ 排序可视化 SortingViz

内置多种排序算法的动画演示。

<v-click />

支持算法：
- **bubble** - 冒泡排序
- **selection** - 选择排序
- **insertion** - 插入排序
- **quick** - 快速排序
- **merge** - 归并排序
- **heap** - 堆排序

---

## 冒泡排序 Bubble Sort

<SortingViz
  :data="[5, 2, 8, 1, 9, 3, 7, 4, 6]"
  :algorithm="'bubble'"
/>

时间复杂度: **O(n²)** | 空间复杂度: **O(1)**

---

## 快速排序 Quick Sort

<SortingViz
  :data="[10, 7, 8, 9, 1, 5, 3, 6, 2, 4]"
  :algorithm="'quick'"
/>

时间复杂度: **O(n log n)** | 空间复杂度: **O(log n)**

---

# 🖥️ CLI 工具功能

AlgoFlow 提供强大的命令行工具：

```bash
# 快速启动主演示
algoflow demo

# 启动开发服务器
algoflow dev slides.md --port 3000

# 验证动画 JSON
algoflow validate animation.json -v

# 执行脚本生成动画
algoflow exec script.js -o output.json

# 构建静态 HTML
algoflow build slides.md -o dist

# 导出 PDF
algoflow export slides.md -f pdf
```

---

## 脚本生成动画

使用 JavaScript 脚本生成复杂动画：

```javascript
// bubble-sort.js
const arr = [5, 2, 8, 1, 9];
const steps = [];

for (let i = 0; i < arr.length; i++) {
  for (let j = 0; j < arr.length - i - 1; j++) {
    steps.push({ action: 'compare', target: [j, j + 1] });
    if (arr[j] > arr[j + 1]) {
      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      steps.push({ action: 'swap', target: [j, j + 1] });
    }
  }
}

export default { initialData: [5, 2, 8, 1, 9], steps };
```

---

# 🎨 主题定制

支持多种主题切换：

<v-click />

- **Light** - 清爽亮色主题
- **Dark** - 护眼暗色主题
- **Sepia** - 复古羊皮纸风格

<v-click />

按 **T** 键或点击工具栏切换主题

---

## 代码高亮展示

```typescript
interface AnimationStep {
  action: ActionType
  target: number | number[]
  value?: unknown
  duration: number
  description?: string
}

type ActionType = 
  | 'highlight' 
  | 'compare' 
  | 'swap' 
  | 'push' 
  | 'pop'
  | 'complete'
```

支持 TypeScript、Python、C++、Java 等多种语言高亮。

---

# 🖌️ 演示工具

AlgoFlow 内置多种演示辅助工具：

<v-click />

| 快捷键 | 功能 |
|--------|------|
| `D` | 画笔绘制模式 |
| `L` | 激光笔模式 |
| `P` | 演讲者模式 |
| `S` | 演讲者备注 |
| `G` | 幻灯片导航 |
| `F` | 全屏模式 |
| `?` | 帮助面板 |

---

## 画笔工具

在演示过程中实时绘制标注：

<v-click />

- 多种颜色选择
- 可调节笔刷粗细
- 橡皮擦功能
- 撤销/重做支持

<v-click />

按 **D** 键开启画笔模式

---

## 激光笔

突出显示关键区域：

<v-click />

- 红色激光点
- 跟随鼠标移动
- 脉冲动画效果

<v-click />

按 **L** 键开启激光笔

---

## 演讲者模式

专业的演示辅助功能：

<v-click />

- 当前幻灯片预览
- 下一张幻灯片提示
- 演讲者备注显示
- 计时器功能

<v-click />

按 **P** 键打开演讲者窗口

---

# 📁 Markdown 语法

创建演示文稿的简单语法：

```markdown
---
title: 我的演示
layout: center
---

# 标题幻灯片

内容...

---

## 新幻灯片

<v-click />

点击动画内容
```

---

# ✅ 功能总结

AlgoFlow 提供完整的功能支持：

<v-click />

**📊 可视化**
- 8 种数据结构组件
- 流畅动画引擎
- 自定义配置

<v-click />

**🛠️ 开发工具**
- CLI 命令行工具
- JSON Schema 验证
- 脚本生成动画

<v-click />

**🎨 演示体验**
- 主题定制
- 画笔/激光笔
- 演讲者模式

---

# 🎉 开始使用

```bash
# 安装
npm install -g algoflow

# 快速体验
algoflow demo

# 创建你的演示
algoflow dev my-slides.md
```

<v-click />

**GitHub**: github.com/algoflow/algoflow

**文档**: algoflow.dev

---

# 谢谢观看！

Questions? 💬

