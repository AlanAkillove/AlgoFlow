---
title: 冒泡排序演示（新语法）
layout: center
---

# 冒泡排序演示

使用新的 `algoflow` 代码块语法

---

## 算法介绍

冒泡排序是一种简单的排序算法：

1. 比较相邻元素
2. 如果顺序错误则交换
3. 重复直到排序完成

时间复杂度: O(n²)

---

## 排序演示

```algoflow
{
  "type": "array",
  "data": [5, 2, 8, 1, 9],
  "steps": [
    { "action": "highlight", "target": [0, 1], "duration": 400 },
    { "action": "swap", "target": [0, 1], "duration": 500 },
    { "action": "highlight", "target": [1, 2], "duration": 400 },
    { "action": "unhighlight", "target": [1, 2], "duration": 200 },
    { "action": "highlight", "target": [2, 3], "duration": 400 },
    { "action": "swap", "target": [2, 3], "duration": 500 },
    { "action": "highlight", "target": [3, 4], "duration": 400 },
    { "action": "unhighlight", "target": [3, 4], "duration": 200 },
    { "action": "complete", "target": [4], "duration": 400 },
    { "action": "highlight", "target": [0, 1], "duration": 400 },
    { "action": "unhighlight", "target": [0, 1], "duration": 200 },
    { "action": "highlight", "target": [1, 2], "duration": 400 },
    { "action": "swap", "target": [1, 2], "duration": 500 },
    { "action": "highlight", "target": [2, 3], "duration": 400 },
    { "action": "unhighlight", "target": [2, 3], "duration": 200 },
    { "action": "complete", "target": [3], "duration": 400 },
    { "action": "highlight", "target": [0, 1], "duration": 400 },
    { "action": "swap", "target": [0, 1], "duration": 500 },
    { "action": "highlight", "target": [1, 2], "duration": 400 },
    { "action": "unhighlight", "target": [1, 2], "duration": 200 },
    { "action": "complete", "target": [2], "duration": 400 },
    { "action": "highlight", "target": [0, 1], "duration": 400 },
    { "action": "unhighlight", "target": [0, 1], "duration": 200 },
    { "action": "complete", "target": [0, 1], "duration": 400 },
    { "action": "complete", "target": [0, 1, 2, 3, 4], "duration": 600 }
  ]
}
```

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
