---
title: 图结构可视化
layout: center
---

# 图结构可视化

使用 AlgoFlow 展示图数据结构

---

## 什么是图？

图是由顶点和边组成的数据结构：

- **顶点**：图中的节点
- **边**：连接两个顶点的线
- **有向图**：边有方向
- **无向图**：边无方向

常见应用：社交网络、地图导航、推荐系统

---

## 图的演示

<GraphViz 
  :nodes="[
    { id: 'A', value: 'A' },
    { id: 'B', value: 'B' },
    { id: 'C', value: 'C' },
    { id: 'D', value: 'D' },
    { id: 'E', value: 'E' }
  ]"
  :edges="[
    { source: 'A', target: 'B' },
    { source: 'A', target: 'C' },
    { source: 'B', target: 'D' },
    { source: 'C', target: 'D' },
    { source: 'D', target: 'E' }
  ]"
/>

---

## 图的表示方法

常见的图表示方法：

1. **邻接矩阵**：二维数组
2. **邻接表**：链表数组
3. **边集数组**：边的集合

---

## BFS 和 DFS

```typescript
// 广度优先搜索
function bfs(graph: Map<string, string[]>, start: string): string[] {
  const visited = new Set<string>()
  const queue = [start]
  const result: string[] = []
  
  while (queue.length > 0) {
    const node = queue.shift()!
    if (!visited.has(node)) {
      visited.add(node)
      result.push(node)
      queue.push(...(graph.get(node) || []))
    }
  }
  return result
}
```

---

## 最短路径

Dijkstra 算法用于计算最短路径：

- 从起点开始
- 每次选择距离最近的未访问节点
- 更新邻居节点的距离
- 直到到达终点

时间复杂度：O((V + E) log V)

---

# 谢谢观看！

Questions?
