---
title: 树结构可视化
layout: center
---

# 树结构可视化

使用 AlgoFlow 展示二叉树数据结构

---

## 什么是树？

树是一种非线性数据结构：

<v-click />
- 由节点和边组成
<v-click />
- 有且只有一个根节点
<v-click />
- 每个节点可以有多个子节点
<v-click />
- 没有环
<v-click />

常见应用：文件系统、DOM树、决策树

<!-- notes: 这里可以详细解释树的特点，强调树在计算机科学中的重要性。可以举例说明文件系统的目录结构就是一棵树。 -->

---

## 二叉搜索树演示

<TreeViz :data="[{
  id: '1',
  value: 50,
  children: [
    {
      id: '2',
      value: 30,
      children: [
        { id: '4', value: 20, children: [] },
        { id: '5', value: 40, children: [] }
      ]
    },
    {
      id: '3',
      value: 70,
      children: [
        { id: '6', value: 60, children: [] },
        { id: '7', value: 80, children: [] }
      ]
    }
  ]
}]" :steps="[
  { action: 'highlight', target: '1', duration: 500 },
  { action: 'highlight', target: '2', duration: 500 },
  { action: 'highlight', target: '4', duration: 500 },
  { action: 'unhighlight', target: '4', duration: 300 },
  { action: 'highlight', target: '5', duration: 500 },
  { action: 'unhighlight', target: '5', duration: 300 },
  { action: 'unhighlight', target: '2', duration: 300 },
  { action: 'highlight', target: '3', duration: 500 },
  { action: 'highlight', target: '6', duration: 500 },
  { action: 'unhighlight', target: '6', duration: 300 },
  { action: 'highlight', target: '7', duration: 500 },
  { action: 'complete', target: ['1','2','3','4','5','6','7'], duration: 500 }
]" />

---

## 树的遍历

常见的遍历方式：

1. **前序遍历**：根 → 左 → 右
2. **中序遍历**：左 → 根 → 右
3. **后序遍历**：左 → 右 → 根
4. **层序遍历**：逐层遍历

---

## 代码实现

```typescript
interface TreeNode {
  value: number
  left: TreeNode | null
  right: TreeNode | null
}

function inorderTraversal(root: TreeNode | null): number[] {
  if (!root) return []
  return [
    ...inorderTraversal(root.left),
    root.value,
    ...inorderTraversal(root.right)
  ]
}
```

---

# 谢谢观看！

Questions?
