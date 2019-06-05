import BButtonToolbar from './button-toolbar'
import { installFactory } from '../../utils/plugins'
import { BvPlugin, BvComponent } from '../../'

const components = {
  BButtonToolbar,
  BBtnToolbar: BButtonToolbar
}

export { BButtonToolbar }
export const ButtonToolbarPlugin: BvPlugin = {
  install: installFactory({ components })
}
export default ButtonToolbarPlugin