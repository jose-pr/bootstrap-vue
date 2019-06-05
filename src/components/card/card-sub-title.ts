import Vue from '../../utils/vue'
import { mergeData } from 'vue-functional-data-merge'
import { getComponentConfig } from '../../utils/config'
import { BvComponent, PropsDef } from '../..';

const NAME = 'BCardSubTitle'

export interface BvCardSubTitle extends BvComponent{
  subTitle:string,
  subTitleTag:string,
  subTitleTextVariant:string
}

export const props:PropsDef<BvCardSubTitle> = {
  subTitle: {
    type: String,
    default: ''
  },
  subTitleTag: {
    type: String,
    default: 'h6'
  },
  subTitleTextVariant: {
    type: String,
    default: () => getComponentConfig(NAME, 'subTitleTextVariant')
  }
}

// @vue/component
export default Vue.extend<BvCardSubTitle>({
  name: NAME,
  functional: true,
  props,
  render(h, { props, data, children }) {
    return h(
      props.subTitleTag,
      mergeData(data, {
        staticClass: 'card-subtitle',
        class: [props.subTitleTextVariant ? `text-${props.subTitleTextVariant}` : null]
      }),
      children || props.subTitle
    )
  }
})
