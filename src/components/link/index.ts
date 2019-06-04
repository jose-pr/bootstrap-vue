//
// Alert
//
import { BvPlugin } from '../../'
import BLink from './link'
import { installFactory } from '../../utils/plugins'

// Plugin
const LinkPlugin:BvPlugin = {
  install: installFactory({components:{ BLink }})
}

//Exports
export default LinkPlugin
export { BLink }
