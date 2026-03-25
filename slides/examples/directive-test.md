---
title: 标签页功能测试
layout: center
---

# 标签页功能测试

测试 layout、animation、transition 指令

---

## Layout 测试：居中对齐

<!-- layout: { "align": "center", "padding": 60 } -->

内容已居中对齐

<ArrayViz :data="[5, 3, 8, 1, 9]" />

---

## Layout 测试：左对齐

<!-- layout: { "align": "left", "padding": 40 } -->

内容左对齐显示

<StackViz :data="[10, 20, 30]" />

---

## Transition 测试：Fade

<!-- transition: fade -->

这个幻灯片使用 **fade** 切换效果

淡入淡出过渡动画

---

## Transition 测试：Zoom

<!-- transition: zoom -->

这个幻灯片使用 **zoom** 切换效果

缩放过渡动画

---

## Transition 测试：Flip

<!-- transition: flip -->

这个幻灯片使用 **flip** 切换效果

翻转过渡动画

---

## Animation 测试：Slide-in

<!-- animation: slide-in -->

内容使用 **slide-in** 动画效果

<QueueViz :data="[1, 2, 3, 4]" />

---

## Animation 测试：Zoom-in

<!-- animation: zoom-in -->

内容使用 **zoom-in** 动画效果

<HeapViz :data="[16, 14, 10, 8, 7]" />

---

## Animation 测试：Bounce-in

<!-- animation: bounce-in -->

内容使用 **bounce-in** 弹跳动画效果

<TreeViz
  :data="[
    {
      id: 'root',
      value: 50,
      children: [
        { id: 'l', value: 30, children: [] },
        { id: 'r', value: 70, children: [] }
      ]
    }
  ]"
/>

---

## 组合测试

<!-- layout: { "align": "center", "padding": 50 } -->
<!-- transition: slide -->
<!-- animation: fade-in -->

同时使用多个指令：
- 居中布局
- 滑动切换
- 淡入动画

<GraphViz
  :nodes="[
    { id: 'A', value: 'A' },
    { id: 'B', value: 'B' },
    { id: 'C', value: 'C' }
  ]"
  :edges="[
    { source: 'A', target: 'B' },
    { source: 'B', target: 'C' }
  ]"
/>

---

# 测试完成！

所有标签页功能正常工作 ✅
