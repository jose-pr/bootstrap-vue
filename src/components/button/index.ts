//
// Buttons
//
import Vue from 'vue'
import { BvPlugin, BvComponent } from '../../'
import BButton from './button'
import BButtonClose from './button-close'
import { installFactory } from '../../utils/plugins'

const components = {
  BButton,
  BBtn: BButton,
  BButtonClose,
  BBtnClose: BButtonClose
}

// Plugin
export const ButtonPlugin: BvPlugin = {
  install: installFactory({ components })
}

export default ButtonPlugin

export { BButton, BButtonClose }


