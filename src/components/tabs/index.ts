import BTabs from './tabs'
import BTab from './tab'
import { installFactory } from '../../utils/plugins'
import { BvPlugin } from '../..';

const components = {
  BTabs,
  BTab
}

export { BTabs, BTab }

export const TabsPlugin:BvPlugin={
  install: installFactory({ components })
}
export default TabsPlugin;
