import Vue from '../../utils/vue'
import listenOnRootMixin from '../../mixins/listen-on-root'
import normalizeSlotMixin from '../../mixins/normalize-slot'
import { isBrowser } from '../../utils/env'
import {
  addClass,
  hasClass,
  removeClass,
  closest,
  matches,
  reflow,
  getCS,
  getBCR,
  eventOn,
  eventOff
} from '../../utils/dom'
import Component, { mixins } from 'vue-class-component';
import { Model, Prop, Watch } from 'vue-property-decorator';
import { CreateElement } from 'vue';

// Events we emit on $root
const EVENT_STATE = 'bv::collapse::state'
const EVENT_ACCORDION = 'bv::collapse::accordion'
// Private event we emit on `$root` to ensure the toggle state is
// always synced. It gets emitted even if the state has not changed!
// This event is NOT to be documented as people should not be using it
const EVENT_STATE_SYNC = 'bv::collapse::sync::state'
// Events we listen to on `$root`
const EVENT_TOGGLE = 'bv::toggle::collapse'
const EVENT_STATE_REQUEST = 'bv::request::collapse::state'

// Event listener options
const EventOptions = { passive: true, capture: false }

// @vue/component
@Component({})
export default class BCollapse extends mixins(listenOnRootMixin, normalizeSlotMixin){
  @Model('input') visible!:boolean

  @Prop({required:true}) id!:string
  @Prop({default:false}) isNav!:boolean
  @Prop({default:null}) accordion!:string
  @Prop({default:'div'}) tag!:string

  show:boolean = this.visible;
  transitioning:boolean=false;

  get classObject() {
    return {
      'navbar-collapse': this.isNav,
      collapse: !this.transitioning,
      show: this.show && !this.transitioning
    }
  }

  @Watch('visible')
  onVisible(newVal:boolean) {
    if (newVal !== this.show) {
      this.show = newVal
    }
  }
  @Watch('show')
  onShow(newVal:boolean, oldVal:boolean) {
    if (newVal !== oldVal) {
      this.emitState()
    }
  }

  created() {
    this.show = this.visible
  }
  mounted() {
    this.show = this.visible
    // Listen for toggle events to open/close us
    this.listenOnRoot(EVENT_TOGGLE, this.handleToggleEvt)
    // Listen to other collapses for accordion events
    this.listenOnRoot(EVENT_ACCORDION, this.handleAccordionEvt)
    if (this.isNav) {
      // Set up handlers
      this.setWindowEvents(true)
      this.handleResize()
    }
    this.$nextTick(() => {
      this.emitState()
    })
    // Listen for "Sync state" requests from `v-b-toggle`
    this.$root.$on(EVENT_STATE_REQUEST, (id:string) => {
      if (id === this.id) {
        this.$nextTick(this.emitSync)
      }
    })
  }
  updated() {
    // Emit a private event every time this component updates to ensure
    // the toggle button is in sync with the collapse's state
    // It is emitted regardless if the visible state changes
    this.emitSync()
  }
  deactivated() /* istanbul ignore next */ {
    if (this.isNav) {
      this.setWindowEvents(false)
    }
  }
  activated() /* istanbul ignore next */ {
    if (this.isNav) {
      this.setWindowEvents(true)
    }
    this.emitSync()
  }
  beforeDestroy() {
    // Trigger state emit if needed
    this.show = false
    if (this.isNav && isBrowser) {
      this.setWindowEvents(false)
    }
  }

  setWindowEvents(on:boolean) {
    const method = on ? eventOn : eventOff
    method(window, 'resize', this.handleResize, EventOptions)
    method(window, 'orientationchange', this.handleResize, EventOptions)
  }
  toggle() {
    this.show = !this.show
  }
  onEnter(el:HTMLElement) {
    el.style.height = '0'
    reflow(el)
    el.style.height = el.scrollHeight + 'px'
    this.transitioning = true
    // This should be moved out so we can add cancellable events
    this.$emit('show')
  }
  onAfterEnter(el:HTMLElement) {
    el.style.height = null
    this.transitioning = false
    this.$emit('shown')
  }
  onLeave(el:HTMLElement) {
    el.style.height = 'auto'
    el.style.display = 'block'
    el.style.height = getBCR(el)!.height + 'px'
    reflow(el)
    this.transitioning = true
    el.style.height = '0'
    // This should be moved out so we can add cancellable events
    this.$emit('hide')
  }
  onAfterLeave(el:HTMLElement) {
    el.style.height = null
    this.transitioning = false
    this.$emit('hidden')
  }
  emitState() {
    this.$emit('input', this.show)
    // Let v-b-toggle know the state of this collapse
    this.$root.$emit(EVENT_STATE, this.id, this.show)
    if (this.accordion && this.show) {
      // Tell the other collapses in this accordion to close
      this.$root.$emit(EVENT_ACCORDION, this.id, this.accordion)
    }
  }
  emitSync() {
    // Emit a private event every time this component updates to ensure
    // the toggle button is in sync with the collapse's state
    // It is emitted regardless if the visible state changes
    this.$root.$emit(EVENT_STATE_SYNC, this.id, this.show)
  }
  checkDisplayBlock() {
    // Check to see if the collapse has `display: block !important;` set.
    // We can't set `display: none;` directly on this.$el, as it would
    // trigger a new transition to start (or cancel a current one).
    const restore = hasClass(this.$el as HTMLElement, 'show')
    removeClass(this.$el as HTMLElement, 'show')
    const isBlock = getCS(this.$el).display === 'block'
    restore && addClass(this.$el as HTMLElement, 'show')
    return isBlock
  }
  clickHandler(evt:Event) {
    // If we are in a nav/navbar, close the collapse when non-disabled link clicked
    const el = evt.target
    if (!this.isNav || !el || getCS(this.$el).display !== 'block') {
      /* istanbul ignore next: can't test getComputedStyle in JSDOM */
      return
    }
    if (matches(el as Element, '.nav-link,.dropdown-item') || closest('.nav-link,.dropdown-item', el as Element)) {
      if (!this.checkDisplayBlock()) {
        // Only close the collapse if it is not forced to be 'display: block !important;'
        this.show = false
      }
    }
  }
  handleToggleEvt(target:string) {
    if (target !== this.id) {
      return
    }
    this.toggle()
  }
  handleAccordionEvt(openedId:string, accordion:string) {
    if (!this.accordion || accordion !== this.accordion) {
      return
    }
    if (openedId === this.id) {
      // Open this collapse if not shown
      if (!this.show) {
        this.toggle()
      }
    } else {
      // Close this collapse if shown
      if (this.show) {
        this.toggle()
      }
    }
  }
  handleResize() {
    // Handler for orientation/resize to set collapsed state in nav/navbar
    this.show = getCS(this.$el).display === 'block'
  }

  render(h:CreateElement) {
    const content = h(
      this.tag,
      {
        class: this.classObject,
        directives: [{ name: 'show', value: this.show }],
        attrs: { id: this.id || null },
        on: { click: this.clickHandler }
      },
      [this.normalizeSlot('default')]
    )
    return h(
      'transition',
      {
        props: {
          enterClass: '',
          enterActiveClass: 'collapsing',
          enterToClass: '',
          leaveClass: '',
          leaveActiveClass: 'collapsing',
          leaveToClass: ''
        },
        on: {
          enter: this.onEnter,
          afterEnter: this.onAfterEnter,
          leave: this.onLeave,
          afterLeave: this.onAfterLeave
        }
      },
      [content]
    )
  }
}
