import Vue from '../../utils/vue'
import { mergeData } from 'vue-functional-data-merge'
import prefixPropName from '../../utils/prefix-prop-name'
import copyProps from '../../utils/copy-props'
import { htmlOrText } from '../../utils/html'
import cardMixin from '../../mixins/card-mixin'
import { BvComponent, PropsDef } from '../..';

export interface BvCardHeader extends BvComponent {
  headerTag: string
  headerBgVariant: string
  headerBorderVariant: string
  headerTextVariant: string
  header:string,
  headerHtml:string,
  headerClass:string
}
export const props:PropsDef<BvCardHeader> = {
  ...copyProps(cardMixin.props, prefixPropName.bind(null, 'header')),
  header: {
    type: String,
    default: null
  },
  headerHtml: {
    type: String,
    default: null
  },
  headerClass: {
    type: [String, Object, Array],
    default: null
  }
}

// @vue/component
export default Vue.extend<BvCardHeader>({
  name: 'BCardHeader',
  functional: true,
  props,
  render(h, { props, data, children }) {
    return h(
      props.headerTag,
      mergeData(data, {
        staticClass: 'card-header',
        class: [
          props.headerClass,
          {
            [`bg-${props.headerBgVariant}`]: Boolean(props.headerBgVariant),
            [`border-${props.headerBorderVariant}`]: Boolean(props.headerBorderVariant),
            [`text-${props.headerTextVariant}`]: Boolean(props.headerTextVariant)
          }
        ]
      }),
      children || [h('div', { domProps: htmlOrText(props.headerHtml, props.header) })]
    )
  }
})
