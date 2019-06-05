import Vue from '../../utils/vue'
import BImgLazy, { BvImgLazy, props as imgLazyProps } from '../image/img-lazy'
import { omit } from '../../utils/object'
import { mergeData } from 'vue-functional-data-merge'
import { BvComponent, Omit, PropsDef } from '../..';
import { BCardImgLazy } from '.';

// Copy of `<b-img-lazy>` props, and remove conflicting/non-applicable props
// The `omit()` util creates a new object, so we can just pass the original props
const lazyProps:PropsDef<Omit<BvImgLazy,"fluidGrow"|"fluid"|"thumbnail"|"rounded"|"block"|"center">> = omit(imgLazyProps, [
  'left',
  'right',
  'center',
  'block',
  'rounded',
  'thumbnail',
  'fluid',
  'fluidGrow'
]) as any

export interface BvCardImgLazy extends BvComponent, Omit<BvImgLazy,"fluidGrow"|"fluid"|"thumbnail"|"rounded"|"block"|"center"|"src">{
  top:boolean,
  bottom:boolean,
  start:boolean,
  end:boolean
}

export const props:PropsDef<BvCardImgLazy> = {
  ...lazyProps,
  top: {
    type: Boolean,
    default: false
  },
  bottom: {
    type: Boolean,
    default: false
  },
  left: {
    type: Boolean,
    default: false
  },
  start: {
    type: Boolean,
    default: false
    // alias of 'left'
  },
  right: {
    type: Boolean,
    default: false
  },
  end: {
    type: Boolean,
    default: false
    // alias of 'right'
  }
}

// @vue/component
export default Vue.extend<BvCardImgLazy>({
  name: 'BCardImgLazy',
  functional: true,
  props,
  render(h, { props, data }) {
    let baseClass = 'card-img'
    if (props.top) {
      baseClass += '-top'
    } else if (props.right || props.end) {
      baseClass += '-right'
    } else if (props.bottom) {
      baseClass += '-bottom'
    } else if (props.left || props.start) {
      baseClass += '-left'
    }

    // False out the left/center/right props before passing to b-img-lazy
    const lazyProps = { ...props, left: false, right: false, center: false }
    return h(
      BImgLazy,
      mergeData(data, {
        class: [baseClass],
        props: lazyProps
      })
    )
  }
})
