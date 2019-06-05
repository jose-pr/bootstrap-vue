import Vue from '../../utils/vue'
import ToolTip from '../../utils/tooltip.class'
import warn from '../../utils/warn'
import { isArray, arrayIncludes } from '../../utils/array'
import { getComponentConfig } from '../../utils/config'
import { HTMLElement } from '../../utils/safe-types'
import normalizeSlotMixin from '../../mixins/normalize-slot'
import toolpopMixin from '../../mixins/toolpop'
import Component, { mixins } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';

const NAME = "BTooltip"
// @vue/component
@Component({})
export default class BTooltip extends mixins(toolpopMixin, normalizeSlotMixin){
  @Prop({default:''}) title!:string
  @Prop({default:'top'}) placement!:string
  @Prop({default:'flip',validator(value) {
    return isArray(value) || arrayIncludes(['flip', 'clockwise', 'counterclockwise'], value)
  }}) fallbackPlacement!: string|string[]
  @Prop({default: () => getComponentConfig(NAME, 'delay')}) delay!:number|string
  @Prop({default:'hover focus'}) triggers!:string|string[]
  @Prop({default: () => getComponentConfig(NAME, 'boundary')}) boundary!:string|HTMLElement
  @Prop({default: () => getComponentConfig(NAME, 'boundaryPadding')}) boundaryPadding!:number

  createToolpop() {
    // getTarget is in toolpop mixin
    const target = this.getTarget()
    /* istanbul ignore else */
    if (target) {
      this._toolpop = new ToolTip(target, this.getConfig(), this.$root)
    } else {
      this._toolpop = null
      warn("b-tooltip: 'target' element not found!")
    }
    return this._toolpop
  }

  render(h:CreateElement) {
    return h(
      'div',
      { class: ['d-none'], style: { display: 'none' }, attrs: { 'aria-hidden': true } },
      [h('div', { ref: 'title' }, this.normalizeSlot('default'))]
    )
  }
}