//
// Alert
//
import { BvPlugin } from '../../'
import BBadge from './badge'
import { installFactory } from '../../utils/plugins'

// Plugin
const BadgePlugin:BvPlugin = {
  install: installFactory({components:{ BBadge }})
}

//Exports
export default BadgePlugin
export { BBadge }
