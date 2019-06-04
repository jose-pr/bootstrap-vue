//
// Alert
//
import { BvPlugin } from '../../'
import BAlert from './alert'
import { installFactory } from '../../utils/plugins'

// Plugin
const AlertPlugin:BvPlugin = {
  install: installFactory({components:{ BAlert }})
}

//Exports
export default AlertPlugin
export { BAlert }
