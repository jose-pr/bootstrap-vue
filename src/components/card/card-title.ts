import Vue from '../../utils/vue'
import { mergeData } from 'vue-functional-data-merge'
import { BvComponent, PropsDef } from '../..';

export interface BvCardTitle extends BvComponent{
  title:string,
  titleTag:string
}
export const props:PropsDef<BvCardTitle> = {
  title: {
    type: String,
    default: ''
  },
  titleTag: {
    type: String,
    default: 'h4'
  }
}

// @vue/component
export default Vue.extend<BvCardTitle>({
  name: 'BCardTitle',
  functional: true,
  props,
  render(h, { props, data, children }) {
    return h(
      props.titleTag,
      mergeData(data, {
        staticClass: 'card-title'
      }),
      children || props.title
    )
  }
})
