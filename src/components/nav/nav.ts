import Vue from '../../utils/vue'
import { mergeData } from 'vue-functional-data-merge'
import { BvComponent, PropsDef } from '../..';
import Component from 'vue-class-component';
import { BTab } from '../tabs';

// -- Constants --

const DEPRECATED_MSG =
  'Setting prop "is-nav-bar" is deprecated. Use the <b-navbar-nav> component instead.'

export interface  BvNav extends BvComponent{
  tag:string;
  fill:boolean;
  justified:boolean;
  align:string;
  tabs:BTab[];
  pills:boolean;
  vertical:boolean;
  small:boolean;
}


export const props:PropsDef<BvNav> = {
  tag: {
    type: String,
    default: 'ul'
  },
  fill: {
    type: Boolean,
    default: false
  },
  justified: {
    type: Boolean,
    default: false
  },
  align: {
    type: String,
    default: null
  },
  tabs: {
    type: Boolean,
    default: false
  },
  pills: {
    type: Boolean,
    default: false
  },
  vertical: {
    type: Boolean,
    default: false
  },
  small: {
    type: Boolean,
    default: false
  }
}

// -- Utils --

const computeJustifyContent = (value:string) => {
  // Normalize value
  value = value === 'left' ? 'start' : value === 'right' ? 'end' : value
  return `justify-content-${value}`
}

// @vue/component
export default Vue.extend<BvNav>({
  name: 'BNav',
  functional: true,
  props,
  render(h, { props, data, children }) {
    return h(
      props.tag,
      mergeData(data, {
        class: {
          nav: true,
          'nav-tabs': props.tabs,
          'nav-pills': props.pills,
          'flex-column': props.vertical,
          'nav-fill': !props.vertical && props.fill,
          'nav-justified': !props.vertical && props.justified,
          [computeJustifyContent(props.align)]: !props.vertical && props.align,
          small: props.small
        }
      }),
      children
    )
  }
})
