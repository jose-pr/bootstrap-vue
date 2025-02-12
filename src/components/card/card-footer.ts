import Vue from '../../utils/vue'
import { mergeData } from 'vue-functional-data-merge'

import prefixPropName from '../../utils/prefix-prop-name'
import copyProps from '../../utils/copy-props'
import { htmlOrText } from '../../utils/html'
import cardMixin from '../../mixins/card-mixin'
import { BvComponent, PropsDef } from '../..';

export interface BvCardFooter extends BvComponent{
  footerClass:string|string[] //add to mixin
  footerHtml:string
  footerTag: string
  footerBgVariant: string
  footerBorderVariant: string
  footerTextVariant: string
  footer:string
}

export const props:PropsDef<BvCardFooter> = {
  ...copyProps(cardMixin.props, prefixPropName.bind(null, 'footer')),
  footer: {
    type: String,
    default: null
  },
  footerHtml: {
    type: String,
    default: null
  },
  footerClass: {
    type: [String, Object, Array],
    default: null
  }
}

// @vue/component
export default Vue.extend<BvCardFooter>({
  name: 'BCardFooter',
  functional: true,
  props,
  render(h, { props, data, children }) {
    return h(
      props.footerTag,
      mergeData(data, {
        staticClass: 'card-footer',
        class: [
          props.footerClass,
          {
            [`bg-${props.footerBgVariant}`]: Boolean(props.footerBgVariant),
            [`border-${props.footerBorderVariant}`]: Boolean(props.footerBorderVariant),
            [`text-${props.footerTextVariant}`]: Boolean(props.footerTextVariant)
          }
        ]
      }),
      children || [h('div', { domProps: htmlOrText(props.footerHtml, props.footer) })]
    )
  }
})
