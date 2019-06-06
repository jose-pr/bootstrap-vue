import BTooltip from './tooltip'
import VBTooltip from '../../directives/tooltip/tooltip'
import { installFactory } from '../../utils/plugins'
import { BvPlugin } from '../..';

const components = {
  BTooltip
}

const directives = {
  VBTooltip
}

export { BTooltip }

export const TooltipPlugin:BvPlugin = {
  install: installFactory({ components, directives })
}
export default TooltipPlugin;
