# 冒泡排序可视化脚本
arr = [64, 34, 25, 12, 22, 11, 90]

# 初始化
algoflow.set_type('array')
algoflow.set_data(arr)
algoflow.set_metadata({
    'title': 'Bubble Sort',
    'algorithm': 'bubble',
    'complexity': {'time': 'O(n²)', 'space': 'O(1)'}
})

# 冒泡排序
n = len(arr)
for i in range(n - 1):
    for j in range(n - i - 1):
        # 比较相邻元素
        algoflow.compare([j, j + 1], f'比较 {arr[j]} 和 {arr[j + 1]}')
        
        if arr[j] > arr[j + 1]:
            # 交换
            arr[j], arr[j + 1] = arr[j + 1], arr[j]
            algoflow.swap_animated(j, j + 1, f'交换 {arr[j + 1]} 和 {arr[j]}')
    
    # 标记已排序位置
    algoflow.complete(n - i - 1, f'位置 {n - i - 1} 已排序')

algoflow.complete(0, '排序完成')
algoflow.log('冒泡排序完成！')
