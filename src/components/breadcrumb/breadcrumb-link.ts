import Vue from '../../utils/vue'
import { mergeData } from 'vue-functional-data-merge'
import pluckProps from '../../utils/pluck-props'
import BLink, { propsFactory as linkPropsFactory, BvLink } from '../link/link'
import { htmlOrText } from '../../utils/html'
import { PropOptions, VNodeData } from 'vue';
import { Dict, BvComponent, PropsDef } from '../..';

export const props:PropsDef<BvBreadcrumbLink> = {
  ...linkPropsFactory(),
  text: {
    type: String,
    default: null
  },
  html: {
    type: String,
    default: null
  },
  ariaCurrent: {
    type: String,
    default: 'location'
  }
}
export interface BvBreadcrumbLink extends BvLink{
  text?:string,
  html?:string,
  ariaCurrent?:string
}
// @vue/component
export default Vue.extend<BvBreadcrumbLink>({
  name: 'BBreadcrumbLink',
  functional: true,
  props,
  render(h, { props: suppliedProps, data, children }) {
    const tag = suppliedProps.active ? 'span' : BLink
    
    let componentData:VNodeData = { props: pluckProps(props, suppliedProps) }
    if (suppliedProps.active) {
      componentData.attrs = { 'aria-current': suppliedProps.ariaCurrent }
    }

    if (!children) {
      componentData.domProps = htmlOrText(suppliedProps.html, suppliedProps.text)
    }

    return h(tag, mergeData(data, componentData), children)
  }
})
