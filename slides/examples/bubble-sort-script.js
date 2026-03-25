// 冒泡排序可视化脚本
const arr = [64, 34, 25, 12, 22, 11, 90]

// 初始化
algoflow.setType('array')
algoflow.setData(arr)
algoflow.setMetadata({
  title: 'Bubble Sort',
  algorithm: 'bubble',
  complexity: { time: 'O(n²)', space: 'O(1)' }
})

// 冒泡排序
const n = arr.length
for (let i = 0; i < n - 1; i++) {
  for (let j = 0; j < n - i - 1; j++) {
    // 比较相邻元素
    algoflow.compare([j, j + 1], `比较 ${arr[j]} 和 ${arr[j + 1]}`)
    
    if (arr[j] > arr[j + 1]) {
      // 交换
      algoflow.swapAnimated(j, j + 1, `交换 ${arr[j]} 和 ${arr[j + 1]}`)
    }
  }
  // 标记已排序位置
  algoflow.complete(n - i - 1, `位置 ${n - i - 1} 已排序`)
}

algoflow.complete(0, '排序完成')
console.log('冒泡排序完成！')
