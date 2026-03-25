---
title: AlgoFlow 可视化演示
layout: center
---

# AlgoFlow 可视化演示

数据结构与算法可视化组件展示

---

## 数组可视化 ArrayViz

<ArrayViz :data="[64, 34, 25, 12, 22, 11, 90]" :show-values="true" />

---

## 树结构 TreeViz

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

---

## 图结构 GraphViz

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

## 堆可视化 HeapViz

<HeapViz :data="[16, 14, 10, 8, 7, 9, 3, 2, 4, 1]" :heap-type="'max'" />

---

## 栈可视化 StackViz

<StackViz :data="[10, 20, 30, 40, 50]" :show-pointers="true" />

---

## 队列可视化 QueueViz

<QueueViz :data="[1, 2, 3, 4, 5]" :show-pointers="true" />

---

## 二叉搜索树 BSTViz

<BSTViz :data="[50, 30, 70, 20, 40, 60, 80]" />

---

## 排序可视化 SortingViz

<SortingViz :data="[5, 2, 8, 1, 9, 3, 7, 4, 6]" :algorithm="'bubble'" />

---

# 谢谢观看！
