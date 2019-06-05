//
// Button Group
//
import Vue from 'vue'
import { BvPlugin, BvComponent } from '../../'
import BButtonGroup from './button-group'
import { installFactory } from '../../utils/plugins'

const components = {
  BButtonGroup,
  BBtnGroup: BButtonGroup
}

export { BButtonGroup }

export const ButtonGroupPlugin:BvPlugin = {
  install: installFactory({ components })
}

