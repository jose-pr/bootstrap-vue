//
// Alert
//
import { BvPlugin } from '../../'
import BAlert from './alert'
import { installFactory } from '../../utils/plugins'

// Plugin
const AlertPlugin:BvPlugin = {
  install: installFactory({ BAlert }) as any
}

//Exports
export default AlertPlugin
export { BAlert }
