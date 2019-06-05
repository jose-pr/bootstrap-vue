import Vue from '../../utils/vue'
import { mergeData } from 'vue-functional-data-merge'
import prefixPropName from '../../utils/prefix-prop-name'
import unPrefixPropName from '../../utils/unprefix-prop-name'
import copyProps from '../../utils/copy-props'
import pluckProps from '../../utils/pluck-props'
import { hasNormalizedSlot, normalizeSlot } from '../../utils/normalize-slot'
import cardMixin, { CardMixin } from '../../mixins/card-mixin'
import BCardBody, { props as bodyProps, BvCardBody } from './card-body'
import BCardHeader, { props as headerProps, BvCardHeader } from './card-header'
import BCardFooter, { props as footerProps, BvCardFooter } from './card-footer'
import BCardImg, { props as imgProps, BvCardImg } from './card-img'
import { PropsDef } from '../..';
import { VNodeChildren, VNode } from 'vue';
import {BCardImg as i} from "./index"

interface _img {
  imgSrc:string
  imgAlt:string
  imgTop:boolean
  imgBottom:boolean
  imgLeft:boolean
  imgStart:boolean
  imgRight:boolean
  imgEnd:boolean
  imgHeight:string
  imgWidth:string
}

const cardImgProps = copyProps(imgProps, prefixPropName.bind(null, 'img')) as PropsDef<_img>
cardImgProps.imgSrc.required = false

interface BvCard extends BvCardBody, BvCardHeader, BvCardFooter, CardMixin, _img{
  align:string
  noBody:boolean
}

export const props:PropsDef<BvCard> = {
  ...bodyProps,
  ...headerProps,
  ...footerProps,
  ...cardImgProps,
  ...copyProps(cardMixin.props) as PropsDef<CardMixin> ,
  align: {
    type: String,
    default: null
  },
  noBody: {
    type: Boolean,
    default: false
  }
}

// @vue/component
export default Vue.extend<BvCard>({
  name: 'BCard',
  functional: true,
  props,
  render(h, { props, data, slots, scopedSlots }) {
    const $slots = slots()
    // Vue < 2.6.x may return undefined for scopedSlots
    const $scopedSlots = scopedSlots || {}

    // Create placeholder elements for each section
    let imgFirst = h()
    let header = h()
    let content:VNode|VNode[] = h()
    let footer = h()
    let imgLast = h()

    if (props.imgSrc) {
      let img = h(BCardImg, {
        props: pluckProps<BvCardImg>(cardImgProps, props, unPrefixPropName.bind(null, 'img'))
      })
      if (props.imgBottom) {
        imgLast = img
      } else {
        imgFirst = img
      }
    }

    if (props.header || hasNormalizedSlot('header', $scopedSlots, $slots)) {
      header = h(
        BCardHeader,
        { props: pluckProps(headerProps, props) },
        normalizeSlot('header', undefined, $scopedSlots, $slots) as VNodeChildren
      )
    }

    content = (normalizeSlot('default', undefined, $scopedSlots, $slots) || []) as VNode[]
    if (!props.noBody) {
      // Wrap content in card-body
      content = [h(BCardBody, { props: pluckProps(bodyProps, props) }, [...content])]
    }

    if (props.footer || hasNormalizedSlot('footer', $scopedSlots, $slots)) {
      footer = h(
        BCardFooter,
        {
          props: pluckProps(footerProps, props)
        },
        normalizeSlot('footer', undefined, $scopedSlots, $slots) as VNodeChildren
      )
    }

    return h(
      props.tag,
      mergeData(data, {
        staticClass: 'card',
        class: {
          'flex-row': props.imgLeft || props.imgStart,
          'flex-row-reverse':
            (props.imgRight || props.imgEnd) && !(props.imgLeft || props.imgStart),
          [`text-${props.align}`]: Boolean(props.align),
          [`bg-${props.bgVariant}`]: Boolean(props.bgVariant),
          [`border-${props.borderVariant}`]: Boolean(props.borderVariant),
          [`text-${props.textVariant}`]: Boolean(props.textVariant)
        }
      }),
      [imgFirst, header, ...content, footer, imgLast]
    )
  }
})
