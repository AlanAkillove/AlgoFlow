/**
 * @algoflow/core - Plugin Manager
 * 
 * 插件管理器，负责插件的注册、卸载和生命周期管理
 */

import type { App } from 'vue'
import type {
  AlgoFlowPlugin,
  PluginOptions,
  PluginRegistrationResult,
  MarkdownExtension,
  SlideInfo,
} from './types'
import type { Theme } from '../theme/types'

/**
 * 插件管理器类
 */
export class PluginManager {
  private plugins: Map<string, AlgoFlowPlugin> = new Map()
  private app: App | null = null
  private markdownExtensions: MarkdownExtension[] = []
  private themes: Map<string, Theme> = new Map()
  private isDebug: boolean = false

  /**
   * 初始化插件管理器
   */
  init(app: App, options?: PluginOptions): void {
    this.app = app
    this.isDebug = options?.debug ?? false
    this.log('PluginManager initialized')
  }

  /**
   * 注册插件
   */
  register(
    plugin: AlgoFlowPlugin,
    options?: PluginOptions
  ): PluginRegistrationResult {
    // Validate plugin
    if (!plugin.name) {
      return {
        success: false,
        error: 'Plugin must have a name',
      }
    }

    if (!plugin.version) {
      return {
        success: false,
        error: 'Plugin must have a version',
      }
    }

    // Check if already registered
    if (this.plugins.has(plugin.name)) {
      const existing = this.plugins.get(plugin.name)
      this.log(`Plugin "${plugin.name}" already registered (v${existing?.version})`)
      return {
        success: false,
        error: `Plugin "${plugin.name}" is already registered`,
      }
    }

    try {
      // Register components
      if (plugin.components && this.app) {
        Object.entries(plugin.components).forEach(([name, component]) => {
          this.app!.component(name, component)
          this.log(`Registered component: ${name}`)
        })
      }

      // Register markdown extensions
      if (plugin.markdownExtensions) {
        this.markdownExtensions.push(...plugin.markdownExtensions)
        this.log(`Registered ${plugin.markdownExtensions.length} markdown extensions`)
      }

      // Register themes
      if (plugin.themes) {
        Object.entries(plugin.themes).forEach(([name, theme]) => {
          this.themes.set(name, theme)
          this.log(`Registered theme: ${name}`)
        })
      }

      // Call install hook
      if (plugin.install && this.app) {
        plugin.install(this.app, options)
      }

      // Store plugin
      this.plugins.set(plugin.name, plugin)

      this.log(`Plugin "${plugin.name}" v${plugin.version} registered successfully`)

      return {
        success: true,
        plugin,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.log(`Failed to register plugin "${plugin.name}": ${message}`)
      return {
        success: false,
        error: message,
      }
    }
  }

  /**
   * 卸载插件
   */
  unregister(pluginName: string): boolean {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      this.log(`Plugin "${pluginName}" not found`)
      return false
    }

    // Call uninstall hook
    if (plugin.uninstall) {
      try {
        plugin.uninstall()
      } catch (error) {
        this.log(`Error in uninstall hook for "${pluginName}": ${error}`)
      }
    }

    // Remove markdown extensions
    if (plugin.markdownExtensions) {
      this.markdownExtensions = this.markdownExtensions.filter(
        (ext) => !plugin.markdownExtensions!.includes(ext)
      )
    }

    // Remove themes
    if (plugin.themes) {
      Object.keys(plugin.themes).forEach((name) => {
        this.themes.delete(name)
      })
    }

    this.plugins.delete(pluginName)
    this.log(`Plugin "${pluginName}" unregistered`)

    return true
  }

  /**
   * 获取插件
   */
  getPlugin(name: string): AlgoFlowPlugin | undefined {
    return this.plugins.get(name)
  }

  /**
   * 获取所有已注册的插件
   */
  getAllPlugins(): AlgoFlowPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 获取所有 Markdown 扩展
   */
  getMarkdownExtensions(): MarkdownExtension[] {
    return this.markdownExtensions
  }

  /**
   * 获取所有主题
   */
  getThemes(): Map<string, Theme> {
    return this.themes
  }

  // === 生命周期触发方法 ===

  /**
   * 触发幻灯片切换事件
   */
  emitSlideChange(slide: SlideInfo, index: number): void {
    this.plugins.forEach((plugin) => {
      if (plugin.onSlideChange) {
        try {
          plugin.onSlideChange(slide, index)
        } catch (error) {
          this.log(`Error in onSlideChange for "${plugin.name}": ${error}`)
        }
      }
    })
  }

  /**
   * 触发主题切换事件
   */
  emitThemeChange(theme: Theme): void {
    this.plugins.forEach((plugin) => {
      if (plugin.onThemeChange) {
        try {
          plugin.onThemeChange(theme)
        } catch (error) {
          this.log(`Error in onThemeChange for "${plugin.name}": ${error}`)
        }
      }
    })
  }

  /**
   * 触发初始化事件
   */
  emitInit(): void {
    this.plugins.forEach((plugin) => {
      if (plugin.onInit) {
        try {
          plugin.onInit()
        } catch (error) {
          this.log(`Error in onInit for "${plugin.name}": ${error}`)
        }
      }
    })
  }

  /**
   * 触发销毁事件
   */
  emitDestroy(): void {
    this.plugins.forEach((plugin) => {
      if (plugin.onDestroy) {
        try {
          plugin.onDestroy()
        } catch (error) {
          this.log(`Error in onDestroy for "${plugin.name}": ${error}`)
        }
      }
    })
  }

  /**
   * 清理所有插件
   */
  destroy(): void {
    this.emitDestroy()
    this.plugins.clear()
    this.markdownExtensions = []
    this.themes.clear()
    this.app = null
    this.log('PluginManager destroyed')
  }

  /**
   * 调试日志
   */
  private log(message: string): void {
    if (this.isDebug) {
      console.log(`[PluginManager] ${message}`)
    }
  }
}

// 全局单例实例
export const pluginManager = new PluginManager()

/**
 * 注册插件的便捷函数
 */
export function usePlugin(
  plugin: AlgoFlowPlugin,
  options?: PluginOptions
): PluginRegistrationResult {
  return pluginManager.register(plugin, options)
}

/**
 * 卸载插件的便捷函数
 */
export function removePlugin(name: string): boolean {
  return pluginManager.unregister(name)
}
