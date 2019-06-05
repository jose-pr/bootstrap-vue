import BCollapse from './collapse'
import VBToggle from '../../directives/toggle/toggle'
import { installFactory } from '../../utils/plugins'
import { BvPlugin } from '../..';

const components = {
  BCollapse
}

const directives = {
  VBToggle
}

export { BCollapse }

export const CollapsePlugin:BvPlugin = {
  install: installFactory({ components, directives })
}
export default CollapsePlugin
