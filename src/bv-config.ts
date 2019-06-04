
import Vue from 'vue'
import { BvPlugin } from './'
import { setConfig } from './utils/config'

//
// Utility Plugin for setting the configuration
//
const BVConfigPlugin:BvPlugin = {
  install(Vue, config = {}) {
    setConfig(config)
  }
}
export {
    BVConfigPlugin
}
export default BVConfigPlugin
