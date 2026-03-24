---
title: 冒泡排序可视化
layout: center
---

# 冒泡排序可视化

使用 AlgoFlow 展示冒泡排序算法的执行过程

---

## 算法介绍

冒泡排序是一种简单的排序算法：

1. 比较相邻元素
2. 如果顺序错误则交换
3. 重复直到排序完成

时间复杂度: O(n²)

---

## 排序演示

<ArrayViz 
  :data="[5, 2, 8, 1, 9]" 
  :steps="[
    { action: 'highlight', target: [0, 1], duration: 400, description: '比较 5 和 2' },
    { action: 'swap', target: [0, 1], duration: 500, description: '5 > 2，交换' },
    { action: 'highlight', target: [1, 2], duration: 400, description: '比较 5 和 8' },
    { action: 'unhighlight', target: [1, 2], duration: 200, description: '5 < 8，不交换' },
    { action: 'highlight', target: [2, 3], duration: 400, description: '比较 8 和 1' },
    { action: 'swap', target: [2, 3], duration: 500, description: '8 > 1，交换' },
    { action: 'highlight', target: [3, 4], duration: 400, description: '比较 8 和 9' },
    { action: 'unhighlight', target: [3, 4], duration: 200, description: '8 < 9，不交换' },
    { action: 'complete', target: [4], duration: 400, description: '第一轮完成，9 已就位' },
    { action: 'highlight', target: [0, 1], duration: 400, description: '比较 2 和 5' },
    { action: 'unhighlight', target: [0, 1], duration: 200, description: '2 < 5，不交换' },
    { action: 'highlight', target: [1, 2], duration: 400, description: '比较 5 和 1' },
    { action: 'swap', target: [1, 2], duration: 500, description: '5 > 1，交换' },
    { action: 'highlight', target: [2, 3], duration: 400, description: '比较 5 和 8' },
    { action: 'unhighlight', target: [2, 3], duration: 200, description: '5 < 8，不交换' },
    { action: 'complete', target: [3, 4], duration: 400, description: '第二轮完成，8 已就位' },
    { action: 'highlight', target: [0, 1], duration: 400, description: '比较 2 和 1' },
    { action: 'swap', target: [0, 1], duration: 500, description: '2 > 1，交换' },
    { action: 'highlight', target: [1, 2], duration: 400, description: '比较 2 和 5' },
    { action: 'unhighlight', target: [1, 2], duration: 200, description: '2 < 5，不交换' },
    { action: 'complete', target: [2, 3, 4], duration: 400, description: '第三轮完成，5 已就位' },
    { action: 'highlight', target: [0, 1], duration: 400, description: '比较 1 和 2' },
    { action: 'unhighlight', target: [0, 1], duration: 200, description: '1 < 2，不交换' },
    { action: 'complete', target: [0, 1, 2, 3, 4], duration: 600, description: '排序完成！' }
  ]"
/>

---

## 代码实现

```typescript
function bubbleSort(arr: number[]): number[] {
  const n = arr.length
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
      }
    }
  }
  return arr
}
```

---

# 谢谢观看！

Questions?
