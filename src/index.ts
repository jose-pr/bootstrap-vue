import Vue, { Component, PluginFunction, PluginObject, PropOptions } from 'vue'
import { installFactory } from './utils/plugins'
import { setConfig } from './utils/config'
import { componentsPlugin } from './components/index.esm'
import { directivesPlugin } from './directives/index.esm'
import BVConfigPlugin from './bv-config'

//Interface for easy creation of dictionaries
interface Dict<T>{
  [key:string]:T
}
type PropsDef<T> = {
  [k in keyof T]:PropOptions
}

// BootstrapVue installer
const install = installFactory({ plugins: { componentsPlugin, directivesPlugin } })

// Plugin definition
interface BvPlugin extends PluginObject<BvConfigOptions> {
  install: PluginFunction<BvConfigOptions>
}

// BootstrapVue plugin
interface BootstrapVuePlugin extends BvPlugin {
  setConfig: (config: BvConfigOptions) => void
}
const BootstrapVue:BootstrapVuePlugin = {
  install: install as PluginFunction<BvConfigOptions>,
  setConfig: setConfig
}

// Plugin Config Options
export type BvConfigComponentOptionValue = string | string[] | number | number[] | boolean | object | null
export type BvConfigBreakpointsValue = string[]
export interface BvConfigComponentOptions {
  [key: string]: BvConfigComponentOptionValue | any
}
export interface BvConfigOptions {
  breakpoints?: BvConfigBreakpointsValue
  [key: string]: BvConfigComponentOptions | any
}

// Component base definition
export interface BvComponent {}

// Generic BvEvent Object
export interface BvEvent {
  readonly type: string
  readonly cancelable: boolean
  readonly nativeEvent: any
  readonly target: any
  readonly relatedTarget: any
  readonly defaultPrevented: boolean
  readonly vueTarget: Vue | Component | null
  readonly componentId: string | null
  preventDefault: () => void
  // Catch all
  [key: string]: any
}

// Vue prototype augments
import './vue-injections'

// BvConfig Plugin
export * from './bv-config'

// Components/Plugins
export * from './components'

// Directives/Plugins
export * from './directives'

export default BootstrapVue
// Named exports for BvConfigPlugin and BootstrapVue
export {
  // BV Config Plugin
  BVConfigPlugin,
  // BVConfigPlugin has been documented as BVConfig as well,
  // so we add an alias to the shorter name for backwards compat
  BVConfigPlugin as BVConfig,
  // Main BootstrapVue Plugin
  BootstrapVue,
  // Installer and setConfig exported in case the consumer does not
  // import `default` as the plugin in CommonJS build (or does not
  // have interop enabled for CommonJS). Both the following will work:
  //   BootstrapVue = require('bootstrap-vue')
  //   BootstrapVue = require('bootstrap-vue').default
  //   Vue.use(BootstrapVue)
  install,
  setConfig,
  BvPlugin,
  Dict,
  PropsDef
}
