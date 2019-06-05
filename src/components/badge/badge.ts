import Vue, { CreateElement, PropOptions, VNodeChildren, VNodeData } from 'vue'
import { getComponentConfig } from '../../utils/config'
import { BvComponent, Omit, PropsDef } from '../..';
import { mergeData } from 'vue-functional-data-merge'
import pluckProps from '../../utils/pluck-props'
import Link, { propsFactory as linkPropsFactory, BvLink } from '../link/link'

const NAME = 'BBadge'

let linkProps = linkPropsFactory()
delete linkProps.href.default
delete linkProps.to.default

interface BvBadge extends Omit<BvLink,"href"|"to">{
  tag:string,
  variant:string,
  pill:boolean
}

export const props:PropsDef<BvBadge> = {
  ...linkProps,
  tag: {
    type: String,
    default: 'span'
  },
  variant: {
    type: String,
    default: () => getComponentConfig(NAME, 'variant')
  },
  pill: {
    type: Boolean,
    default: false
  }
}

// @vue/component
export default Vue.extend<BvBadge>({
  name: NAME,
  functional: true,
  props,
  render(h:CreateElement, { props, data, children }) {
    const tag = !(props as any).href && !(props as any).to ? props.tag : Link

    const componentData:VNodeData = {
      staticClass: 'badge',
      class: [
        props.variant ? `badge-${props.variant}` : 'badge-secondary',
        {
          'badge-pill': Boolean(props.pill),
          active: props.active,
          disabled: props.disabled
        }
      ],
      props: pluckProps(linkProps, props)
    }

    return h(tag, mergeData(data, componentData), children)
  }
})