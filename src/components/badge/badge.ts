import Vue, { CreateElement, PropOptions, VNodeChildren } from 'vue'
import { getComponentConfig } from '../../utils/config'
import { BvComponent, Dict } from '../..';
import { mergeData } from 'vue-functional-data-merge'
import pluckProps from '../../utils/pluck-props'
import Link, { propsFactory as linkPropsFactory } from '../link/link'

const NAME = 'BBadge'

let linkProps = linkPropsFactory()
delete linkProps.href.default
delete linkProps.to.default

export const props:Dict<PropOptions> = {
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
export default Vue.extend<BvComponent>({
  name: NAME,
  functional: true,
  props,
  render(h:CreateElement, { props, data, children }) {
    const tag = !props.href && !props.to ? props.tag : Link

    const componentData = {
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