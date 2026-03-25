---
title: AlgoFlow 可视化组件展示
layout: center
---

# AlgoFlow 可视化组件展示

所有数据结构与算法可视化组件一览

---

## 1. 数组可视化 (ArrayViz)

最基础的可视化组件，用于展示数组元素的比较、交换和排序过程。

<ArrayViz
  :data="[64, 34, 25, 12, 22, 11, 90]"
  :show-values="true"
  :show-indices="true"
/>

---

## 2. 栈可视化 (StackViz)

后进先出 (LIFO) 数据结构，支持 push/pop/peek 操作。

```algoflow
{
  "version": "1.0",
  "type": "stack",
  "initialData": [10, 20, 30],
  "config": {
    "itemHeight": 40,
    "itemWidth": 100,
    "showPointers": true
  },
  "steps": [
    { "action": "peek", "target": 2, "description": "查看栈顶: 30" },
    { "action": "push", "target": 3, "value": 40, "description": "Push 40" },
    { "action": "push", "target": 4, "value": 50, "description": "Push 50" },
    { "action": "pop", "target": 4, "description": "Pop 50" },
    { "action": "push", "target": 4, "value": 60, "description": "Push 60" },
    { "action": "complete", "target": [0, 1, 2, 3, 4], "description": "最终栈: [10, 20, 30, 40, 60]" }
  ]
}
```

---

## 3. 队列可视化 (QueueViz)

先进先出 (FIFO) 数据结构，支持 enqueue/dequeue 操作。

```algoflow
{
  "version": "1.0",
  "type": "queue",
  "initialData": [1, 2, 3],
  "config": {
    "itemSize": 50,
    "showPointers": true
  },
  "steps": [
    { "action": "highlight", "target": 0, "description": "FRONT: 1" },
    { "action": "highlight", "target": 2, "description": "REAR: 3" },
    { "action": "enqueue", "target": 3, "value": 4, "description": "Enqueue 4" },
    { "action": "dequeue", "target": 0, "description": "Dequeue 1" },
    { "action": "enqueue", "target": 3, "value": 5, "description": "Enqueue 5" },
    { "action": "complete", "target": [0, 1, 2, 3], "description": "最终队列: [2, 3, 4, 5]" }
  ]
}
```

---

## 4. 堆可视化 (HeapViz)

完全二叉树结构，支持最大堆和最小堆。

```algoflow
{
  "version": "1.0",
  "type": "heap",
  "initialData": [16, 14, 10, 8, 7, 9, 3, 2, 4, 1],
  "config": {
    "heapType": "max",
    "nodeRadius": 22,
    "showValues": true
  },
  "steps": [
    { "action": "highlight", "target": 0, "description": "最大堆根节点: 16" },
    { "action": "compare", "target": [0, 1], "description": "左子节点: 14" },
    { "action": "compare", "target": [0, 2], "description": "右子节点: 10" },
    { "action": "complete", "target": 0, "description": "堆性质满足！" }
  ]
}
```

---

## 5. 二叉搜索树 (BSTViz)

支持查找、插入、删除操作，可平移缩放。

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
  :node-radius="28"
/>

---

## 6. 图结构 (GraphViz)

支持有向图、无向图、带权图。

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

## 7. 排序算法 (SortingViz)

内置 6 种排序算法，自动生成动画步骤。

### 冒泡排序 Bubble Sort

```algoflow
{
  "version": "1.0",
  "type": "sorting",
  "initialData": [5, 2, 8, 1, 9, 3],
  "config": {
    "algorithm": "bubble",
    "showValues": true
  },
  "steps": []
}
```

时间复杂度: **O(n²)** | 空间复杂度: **O(1)**

---

### 快速排序 Quick Sort

```algoflow
{
  "version": "1.0",
  "type": "sorting",
  "initialData": [10, 7, 8, 9, 1, 5],
  "config": {
    "algorithm": "quick",
    "showValues": true
  },
  "steps": []
}
```

时间复杂度: **O(n log n)** | 空间复杂度: **O(log n)**

---

## 组件 API 对比

| 组件 | 数据类型 | 特有操作 | 布局方式 |
|------|----------|----------|----------|
| ArrayViz | number[] | swap, compare | 水平/垂直条形 |
| StackViz | (number\|string)[] | push, pop, peek | 垂直堆叠 |
| QueueViz | (number\|string)[] | enqueue, dequeue | 水平排列 |
| HeapViz | number[] | heapify, extract | 完全二叉树 |
| BSTViz | TreeNode[] | insert, search, delete | 树形布局 |
| GraphViz | GraphData | traverse, path | 力导向布局 |
| SortingViz | number[] | 自动生成步骤 | 条形图 |

---

## CLI 使用示例

```bash
# 验证动画 JSON
algoflow validate animation.json -v

# 执行脚本生成动画
algoflow exec script.js -o animation.json

# 生成排序算法模板
algoflow exec --template bubble -o bubble.js

# 预览动画
algoflow preview animation.json

# 启动开发服务器
algoflow dev slides.md
```

---

# 谢谢观看！🎉

所有组件均支持：
- ✅ 动画播放控制
- ✅ 步骤描述显示
- ✅ 颜色主题配置
- ✅ 响应式布局

GitHub: **algoflow/algoflow**
