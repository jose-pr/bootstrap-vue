import BToast from './toast'
import BToaster from './toaster'
import BVToastPlugin from './helpers/bv-toast'
import { installFactory } from '../../utils/plugins'
import { BvPlugin } from '../..';

const components = {
  BToast,
  BToaster
}

const plugins = {
  // $bvToast injection
  BVToastPlugin
}

export { BToast, BToaster }

export const ToastPlugin:BvPlugin = {
  install: installFactory({ components, plugins })
}

export default ToastPlugin;
