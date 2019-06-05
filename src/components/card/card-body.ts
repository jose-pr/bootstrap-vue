import Vue from '../../utils/vue'
import { mergeData } from 'vue-functional-data-merge'
import prefixPropName from '../../utils/prefix-prop-name'
import copyProps from '../../utils/copy-props'
import pluckProps from '../../utils/pluck-props'
import cardMixin, { CardMixin } from '../../mixins/card-mixin'
import BCardTitle, { props as titleProps, BvCardTitle } from './card-title'
import BCardSubTitle, { props as subTitleProps, BvCardSubTitle } from './card-sub-title'
import { BvComponent, PropsDef } from '../..';

export interface BvCardBody extends BvComponent, BvCardTitle, BvCardSubTitle{
  bodyClass:string|string[],
  overlay:boolean,
  bodyTag: string
  bodyBgVariant: string
  bodyBorderVariant: string
  bodyTextVariant: string
}

export const props:PropsDef<BvCardBody> = {
  // Import common card props and prefix them with `body-`
  ...copyProps(cardMixin.props, prefixPropName.bind(null, 'body')),
  bodyClass: {
    type: [String, Object, Array],
    default: null
  },
  ...titleProps,
  ...subTitleProps,
  overlay: {
    type: Boolean,
    default: false
  }
}

// @vue/component
export default Vue.extend<BvCardBody>({
  name: 'BCardBody',
  functional: true,
  props,
  render(h, { props, data, children }) {
    let cardTitle = h(undefined)
    let cardSubTitle = h(undefined)
    let cardContent = children || [h(undefined)]

    if (props.title) {
      cardTitle = h(BCardTitle, { props: pluckProps<BvCardTitle>(titleProps, props) })
    }

    if (props.subTitle) {
      cardSubTitle = h(BCardSubTitle, {
        props: pluckProps(subTitleProps, props),
        class: ['mb-2']
      })
    }

    return h(
      props.bodyTag,
      mergeData(data, {
        staticClass: 'card-body',
        class: [
          {
            'card-img-overlay': props.overlay,
            [`bg-${props.bodyBgVariant}`]: Boolean(props.bodyBgVariant),
            [`border-${props.bodyBorderVariant}`]: Boolean(props.bodyBorderVariant),
            [`text-${props.bodyTextVariant}`]: Boolean(props.bodyTextVariant)
          },
          props.bodyClass || {}
        ]
      }),
      [cardTitle, cardSubTitle, ...cardContent]
    )
  }
})
