import Vue from '../../utils/vue'
import { mergeData } from 'vue-functional-data-merge'
import { PropsDef } from '../..';

export interface BvCardImg {
  src:string
  alt:string
  top:boolean
  bottom:boolean
  left:boolean
  start:boolean
  right:boolean
  end:boolean
  height:string
  width:string
}

export const props:PropsDef<BvCardImg> = {
  src: {
    type: String,
    default: null,
    required: true
  },
  alt: {
    type: String,
    default: null
  },
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
  },
  height: {
    type: String,
    default: null
  },
  width: {
    type: String,
    default: null
  }
}

// @vue/component
export default Vue.extend<BvCardImg>({
  name: 'BCardImg',
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

    return h(
      'img',
      mergeData(data, {
        class: [baseClass],
        attrs: {
          src: props.src,
          alt: props.alt,
          height: props.height,
          width: props.width
        }
      })
    )
  }
})
