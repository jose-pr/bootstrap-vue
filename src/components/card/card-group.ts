import Vue from '../../utils/vue'
import { mergeData } from 'vue-functional-data-merge'
import { BvComponent, PropsDef } from '../..';

export interface BvCardGroup extends BvComponent{
  tag:string
  deck:boolean,
  columns:boolean
}

export const props:PropsDef<BvCardGroup> = {
  tag: {
    type: String,
    default: 'div'
  },
  deck: {
    type: Boolean,
    default: false
  },
  columns: {
    type: Boolean,
    default: false
  }
}

// @vue/component
export default Vue.extend<BvCardGroup>({
  name: 'BCardGroup',
  functional: true,
  props,
  render(h, { props, data, children }) {
    let baseClass = 'card-group'
    if (props.deck) {
      baseClass = 'card-deck'
    } else if (props.columns) {
      baseClass = 'card-columns'
    }

    return h(props.tag, mergeData(data, { class: baseClass }), children)
  }
})
