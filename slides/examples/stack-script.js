// 栈操作可视化脚本

// 初始化
algoflow.setType('stack')
algoflow.setData([10, 20, 30])
algoflow.setMetadata({
  title: 'Stack Operations',
  algorithm: 'stack',
  description: '演示 push、pop、peek 操作'  
})

// 查看栈顶
algoflow.peek('查看栈顶元素')

// 入栈
algoflow.push(40, 'Push 40')
algoflow.push(50, 'Push 50')

// 出栈
algoflow.pop('Pop 栈顶元素')

// 再次入栈
algoflow.push(60, 'Push 60')

console.log('栈操作演示完成！')
