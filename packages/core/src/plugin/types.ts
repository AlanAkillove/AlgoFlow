/**
 * @algoflow/core - Plugin System Types
 * 
 * 插件系统类型定义，支持可扩展的插件架构
 */

import type { Component, App } from 'vue'
import type { Theme } from '../theme/types'

/**
 * 幻灯片信息
 */
export interface SlideInfo {
  content: string
  frontmatter: Record<string, unknown>
  title: string
  sectionTitle?: string
  notes?: string
}

/**
 * Markdown 扩展接口
 * 用于自定义 Markdown 解析规则
 */
export interface MarkdownExtension {
  /** 扩展名称 */
  name: string
  /** 扩展级别 */
  level: 'block' | 'inline'
  /** 匹配起始模式 */
  start: RegExp | string
  /** 渲染函数 */
  render: (match: RegExpMatchArray, content: string) => string
}

/**
 * 插件选项
 */
export interface PluginOptions {
  /** 是否启用调试模式 */
  debug?: boolean
  /** 其他自定义选项 */
  [key: string]: unknown
}

/**
 * AlgoFlow 插件接口
 */
export interface AlgoFlowPlugin {
  /** 插件名称 (必须唯一) */
  name: string
  /** 插件版本 */
  version: string
  
  /** 插件描述 */
  description?: string
  /** 插件作者 */
  author?: string
  
  /**
   * 安装钩子 - 在插件注册时调用
   * @param app Vue 应用实例
   * @param options 插件选项
   */
  install?(app: App, options?: PluginOptions): void
  
  /**
   * 卸载钩子 - 在插件卸载时调用
   */
  uninstall?(): void
  
  // === 生命周期钩子 ===
  
  /**
   * 幻灯片切换时调用
   */
  onSlideChange?(slide: SlideInfo, index: number): void
  
  /**
   * 主题切换时调用
   */
  onThemeChange?(theme: Theme): void
  
  /**
   * 应用初始化时调用
   */
  onInit?(): void
  
  /**
   * 应用销毁时调用
   */
  onDestroy?(): void
  
  // === 扩展点 ===
  
  /**
   * 注册 Vue 组件
   */
  components?: Record<string, Component>
  
  /**
   * 注册 Composable 函数
   */
  composables?: Record<string, Function>
  
  /**
   * 注册 Markdown 扩展
   */
  markdownExtensions?: MarkdownExtension[]
  
  /**
   * 注册主题
   */
  themes?: Record<string, Theme>
  
  /**
   * 注册命令 (用于 CLI)
   */
  commands?: PluginCommand[]
}

/**
 * 插件命令定义
 */
export interface PluginCommand {
  /** 命令名称 */
  name: string
  /** 命令描述 */
  description: string
  /** 命令别名 */
  aliases?: string[]
  /** 执行函数 */
  action: (args: string[], options: Record<string, unknown>) => Promise<void> | void
}

/**
 * 插件注册结果
 */
export interface PluginRegistrationResult {
  /** 是否成功 */
  success: boolean
  /** 错误信息 (如果失败) */
  error?: string
  /** 插件实例 */
  plugin?: AlgoFlowPlugin
}
