import Vue, { CreateElement } from 'vue'
import reflectMetadata from "reflect-metadata";
import { Component, Prop, Model, Watch } from 'vue-property-decorator'
import { getComponentConfig } from '../../utils/config'
import { requestAF } from '../../utils/dom'
import { isBoolean } from '../../utils/inspect'
import BVTransition from '../../utils/bv-transition'
import normalizeSlotMixin from '../../mixins/normalize-slot'
import BButtonClose from '../button/button-close'
import { mixins } from 'vue-class-component';

const NAME = 'BAlert'

type numberLike = string | number | boolean;
// Convert `show` value to a number
const parseCountDown = (show:numberLike) => {
  if (show === '' || isBoolean(show)) {
    return 0
  }
  show = parseInt(show as string, 10)
  return show > 0 ? show : 0
}

// Convert `show` value to a boolean
const parseShow = (show:numberLike) => {
  if (show === '' || show === true) {
    return true
  }
  if (parseInt(show as string, 10) < 1) {
    // Boolean will always return false for the above comparison
    return false
  }
  return Boolean(show)
}

// Is a value number like (i.e. a number or a number as string)
const isNumericLike = (value:numberLike) => !isNaN(parseInt(value as string, 10))

// @vue/component
@Component
export default class BAlert extends mixins(normalizeSlotMixin){
    //Props
    @Prop({default: () => getComponentConfig(NAME, 'variant')}) variant!:string;
    @Prop({default:false})  dismissible!:boolean;
    @Prop({default:()=>getComponentConfig(NAME, 'dismissLabel')}) dismissLabel!:string;
    @Prop({default:false}) fade!:false;

    //Model
    @Model('input') show!:numberLike

    //Data
    countDownTimerId:any = null;
    countDown:number = 0;
    localShow:boolean = parseShow(this.show) // If initially shown, we need to set these for SSR

    //Watch
    @Watch('show')
    onShow(newVal:numberLike) {
      this.countDown = parseCountDown(newVal)
      this.localShow = parseShow(newVal)
    };
    @Watch('countDown')
    onCountDown(newVal:numberLike) {
      this.clearTimer()
      if (isNumericLike(this.show)) {
        // Ignore if this.show transitions to a boolean value.
        this.$emit('dismiss-count-down', newVal)
        if (this.show !== newVal) {
          // Update the v-model if needed
          this.$emit('input', newVal)
        }
        if (newVal > 0) {
          this.localShow = true
          this.countDownTimerId = setTimeout(() => {
            this.countDown--
          }, 1000)
        } else {
          // Slightly delay the hide to allow any UI updates
          this.$nextTick(() => {
            requestAF(() => {
              this.localShow = false
            })
          })
        }
      }
    }
    @Watch('localShow')
    onLocalShow(newVal:boolean) {
      if (!newVal && (this.dismissible || isNumericLike(this.show))) {
        // Only emit dismissed events for dismissible or auto dismissing alerts
        this.$emit('dismissed')
      }
      if (!isNumericLike(this.show) && this.show !== newVal) {
        // Only emit booleans if we weren't passed a number via `this.show`
        this.$emit('input', newVal)
      }
    }

    //Methods
    dismiss() {
      this.clearTimer()
      this.countDown = 0
      this.localShow = false
    }
    clearTimer() {
      if (this.countDownTimerId) {
        clearInterval(this.countDownTimerId)
        this.countDownTimerId = null
      }
    }

    //Hooks
    created() {
      this.countDown = parseCountDown(this.show)
      this.localShow = parseShow(this.show)
    }
    mounted() {
      this.countDown = parseCountDown(this.show)
      this.localShow = parseShow(this.show)
    }
    beforeDestroy() {
      this.clearTimer()
    }  
    render(h:CreateElement) {
      let $alert // undefined
      if (this.localShow) {
        let $dismissBtn = h(undefined)
        if (this.dismissible) {
          // Add dismiss button
          $dismissBtn = h(
            BButtonClose,
            { attrs: { 'aria-label': this.dismissLabel }, on: { click: this.dismiss } },
            [this.normalizeSlot('dismiss')]
          )
        }
        $alert = h(
          'div',
          {
            key: this._uid,
            staticClass: 'alert',
            class: {
              'alert-dismissible': this.dismissible,
              [`alert-${this.variant}`]: this.variant
            },
            attrs: { role: 'alert', 'aria-live': 'polite', 'aria-atomic': true }
          },
          [$dismissBtn, this.normalizeSlot('default')]
        )
        $alert = [$alert]
      }
      return h(BVTransition, { props: { noFade: !this.fade } }, $alert)
    }
}