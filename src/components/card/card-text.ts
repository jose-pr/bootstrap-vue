import Vue from '../../utils/vue'
import { mergeData } from 'vue-functional-data-merge'
import { BvComponent, PropsDef } from '../..';

export interface BvCardText extends BvComponent{
  textTag:string
}

export const props:PropsDef<BvCardText> = {
  textTag: {
    type: String,
    default: 'p'
  }
}

// @vue/component
export default Vue.extend<BvCardText>({
  name: 'BCardText',
  functional: true,
  props,
  render(h, { props, data, children }) {
    return h(props.textTag, mergeData(data, { staticClass: 'card-text' }), children)
  }
})
