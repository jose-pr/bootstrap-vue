import Vue from '../../utils/vue'
import { Portal, Wormhole } from 'portal-vue'
import BvEvent from '../../utils/bv-event.class'
import BVTransition from '../../utils/bv-transition'
import { getComponentConfig } from '../../utils/config'
import { requestAF, eventOn, eventOff, isVisible } from '../../utils/dom'
import idMixin from '../../mixins/id'
import listenOnRootMixin from '../../mixins/listen-on-root'
import normalizeSlotMixin from '../../mixins/normalize-slot'
import BButtonClose from '../button/button-close'
import BToaster from './toaster'
import BLink from '../link/link'
import Component, { mixins } from 'vue-class-component';
import { BvComponent } from '../..';
import { Model, Prop, Watch } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { ScopedSlot } from 'vue/types/vnode';

// --- Constants ---

const NAME = 'BToast'

const MIN_DURATION = 1000

const EVENT_OPTIONS = { passive: true, capture: false }

// --- Props ---

// @vue/component
@Component({inheritAttrs: false})
export default class BToast extends mixins(idMixin, listenOnRootMixin, normalizeSlotMixin) implements BvComponent{
  @Model('change',{default:false}) visible:boolean = false

  //id
  @Prop() title:string|null = null;
  @Prop({default:() => getComponentConfig(NAME, 'toaster')}) toaster!:string;
  @Prop({default:() => getComponentConfig(NAME, 'variant')}) variant!:string;
  @Prop() isStatus:boolean=false; // Switches role to 'status' and aria-live to 'polite'
  @Prop() appendToast:boolean=false;
  @Prop() noAutoHide:boolean=false;
  @Prop({default: () => getComponentConfig(NAME, 'autoHideDelay')}) autoHideDelay!:number|string;
  @Prop() noCloseButton:boolean=false; 
  @Prop() noFade:boolean=false;
  @Prop() noHoverPause:boolean=false;
  @Prop() solid:boolean=false;
  @Prop({default: () => getComponentConfig(NAME, 'toastClass')}) toastClass!:string|string[];
  @Prop({default: () => getComponentConfig(NAME, 'headerClass')}) headerClass!:string|string[];
  @Prop({default: () => getComponentConfig(NAME, 'bodyClass')}) bodyClass!:string|string[];
  @Prop() href:string|null = null;
  @Prop() to:string|{}|null = null;
  @Prop() static:boolean = false;     // Render the toast in place, rather than in a portal-target

  isMounted = false
  doRender= false
  localShow= false
  isTransitioning= false
  isHiding= false
  order= 0
  timer:NodeJS.Timeout|number|null= null
  dismissStarted= 0
  resumeDismiss= 0

  get bToastClasses() {
    return {
      'b-toast-solid': this.solid,
      'b-toast-append': this.appendToast,
      'b-toast-prepend': !this.appendToast,
      [`b-toast-${this.variant}`]: this.variant
    }
  }
  get slotScope():ScopedSlot {
    return {
      hide: this.hide
    } as any
  }
  get computedDuration() {
    // Minimum supported duration is 1 second
    return Math.max(parseInt(this.autoHideDelay as string, 10) || 0, MIN_DURATION)
  }
  get computedToaster() {
    return String(this.toaster)
  }
  get transitionHandlers() {
    return {
      beforeEnter: this.onBeforeEnter,
      afterEnter: this.onAfterEnter,
      beforeLeave: this.onBeforeLeave,
      afterLeave: this.onAfterLeave
    }
  }

  @Watch('visible')
  onVisible(newVal:boolean) {
    newVal ? this.show() : this.hide()
  }
  @Watch('visible')
  onLocalShow(newVal:boolean) {
    if (newVal !== this.visible) {
      this.$emit('change', newVal)
    }
  }
  @Watch('toaster')
  onToaster(newVal:string) /* istanbul ignore next */ {
    // If toaster target changed, make sure toaster exists
    this.$nextTick(() => this.ensureToaster)
  }
  @Watch('static')
  onStatic(newVal:boolean) /* istanbul ignore next */ {
    // If static changes to true, and the toast is showing,
    // ensure the toaster target exists
    if (newVal && this.localShow) {
      this.ensureToaster()
    }
  }

  mounted() {
    this.isMounted = true
    this.$nextTick(() => {
      if (this.visible) {
        requestAF(() => {
          this.show()
        })
      }
    })
    // Listen for global $root show events
    this.listenOnRoot('bv::show::toast', (id:string) => {
      if (id === this.safeId()) {
        this.show()
      }
    })
    // Listen for global $root hide events
    this.listenOnRoot('bv::hide::toast', (id:string) => {
      if (!id || id === this.safeId()) {
        this.hide()
      }
    })
    // Make sure we hide when toaster is destroyed
    /* istanbul ignore next: difficult to test */
    this.listenOnRoot('bv::toaster::destroyed', (toaster:string) => {
      if (toaster === this.computedToaster) {
        this.hide()
      }
    })
  }
  beforeDestroy() {
    this.clearDismissTimer()
  }

  show() {
    if (!this.localShow) {
      this.ensureToaster()
      const showEvt = this.buildEvent('show')
      this.emitEvent(showEvt)
      this.dismissStarted = this.resumeDismiss = 0
      this.order = Date.now() * (this.appendToast ? 1 : -1)
      this.isHiding = false
      this.doRender = true
      this.$nextTick(() => {
        // We show the toast after we have rendered the portal and b-toast wrapper
        // so that screen readers will properly announce the toast
        requestAF(() => {
          this.localShow = true
        })
      })
    }
  }
  hide() {
    if (this.localShow) {
      const hideEvt = this.buildEvent('hide')
      this.emitEvent(hideEvt)
      this.setHoverHandler(false)
      this.dismissStarted = this.resumeDismiss = 0
      this.clearDismissTimer()
      this.isHiding = true
      requestAF(() => {
        this.localShow = false
      })
    }
  }
  buildEvent<T=any>(type:string, opts:T = {} as any) {
    return new BvEvent<T>(type, {
      cancelable: false,
      target: this.$el || null,
      relatedTarget: null,
      ...opts,
      vueTarget: this,
      componentId: this.safeId()!
    })
  }
  emitEvent(bvEvt:BvEvent) {
    const type = bvEvt.type
    this.$root.$emit(`bv::toast:${type}`, bvEvt)
    this.$emit(type, bvEvt)
  }
  ensureToaster() {
    if (this.static) {
      return
    }
    if (!Wormhole.hasTarget(this.computedToaster)) {
      const div = document.createElement('div')
      document.body.appendChild(div)
      const toaster = new BToaster({
        parent: this.$root,
        propsData: {
          name: this.computedToaster
        }
      })
      toaster.$mount(div)
    }
  }
  startDismissTimer() {
    this.clearDismissTimer()
    if (!this.noAutoHide) {
      this.timer = setTimeout(this.hide, this.resumeDismiss || this.computedDuration)
      this.dismissStarted = Date.now()
      this.resumeDismiss = 0
    }
  }
  clearDismissTimer() {
    clearTimeout(this.timer as number)
    this.timer = null
  }
  setHoverHandler(on:boolean) {
    const method = on ? eventOn : eventOff
    method(this.$refs.btoast as Element, 'mouseenter', this.onPause, EVENT_OPTIONS)
    method(this.$refs.btoast as Element, 'mouseleave', this.onUnPause, EVENT_OPTIONS)
  }
  onPause(evt:Event) {
    // Determine time remaining, and then pause timer
    if (this.noAutoHide || this.noHoverPause || !this.timer || this.resumeDismiss) {
      return
    }
    const passed = Date.now() - this.dismissStarted
    if (passed > 0) {
      this.clearDismissTimer()
      this.resumeDismiss = Math.max(this.computedDuration - passed, MIN_DURATION)
    }
  }
  onUnPause(evt:Event) {
    // Restart timer with max of time remaining or 1 second
    if (this.noAutoHide || this.noHoverPause || !this.resumeDismiss) {
      this.resumeDismiss = this.dismissStarted = 0
      return
    }
    this.startDismissTimer()
  }
  onLinkClick() {
    // We delay the close to allow time for the
    // browser to process the link click
    this.$nextTick(() => {
      requestAF(() => {
        this.hide()
      })
    })
  }
  onBeforeEnter() {
    this.isTransitioning = true
  }
  onAfterEnter() {
    this.isTransitioning = false
    const hiddenEvt = this.buildEvent('shown')
    this.emitEvent(hiddenEvt)
    this.startDismissTimer()
    this.setHoverHandler(true)
  }
  onBeforeLeave() {
    this.isTransitioning = true
  }
  onAfterLeave() {
    this.isTransitioning = false
    this.order = 0
    this.resumeDismiss = this.dismissStarted = 0
    const hiddenEvt = this.buildEvent('hidden')
    this.emitEvent(hiddenEvt)
    this.doRender = false
  }
  makeToast(h:CreateElement) {
    // Render helper for generating the toast
    // Assemble the header content
    const $headerContent = []
    let $title = this.normalizeSlot('toast-title', this.slotScope)
    if ($title) {
      $headerContent.push($title)
    } else if (this.title) {
      $headerContent.push(h('strong', { staticClass: 'mr-2' }, this.title))
    }
    if (!this.noCloseButton) {
      $headerContent.push(
        h(BButtonClose, {
          staticClass: 'ml-auto mb-1',
          on: {
            click: (evt:Event) => {
              this.hide()
            }
          }
        })
      )
    }
    // Assemble the header (if needed)
    let $header = h()
    if ($headerContent.length > 0) {
      $header = h(
        'header',
        { staticClass: 'toast-header', class: this.headerClass },
        $headerContent
      )
    }
    // Toast body
    const isLink = this.href || this.to
    const $body = h(
      isLink ? BLink : 'div',
      {
        staticClass: 'toast-body',
        class: this.bodyClass,
        props: isLink ? { to: this.to, href: this.href } : {},
        on: isLink ? { click: this.onLinkClick } : {}
      },
      [this.normalizeSlot('default', this.slotScope) || h()]
    )
    // Build the toast
    const $toast = h(
      'div',
      {
        key: `toast-${this._uid}`,
        ref: 'toast',
        staticClass: 'toast',
        class: this.toastClass,
        attrs: {
          ...this.$attrs,
          tabindex: '0',
          id: this.safeId()
        }
      },
      [$header, $body]
    )
    return $toast
  }

  render(h:CreateElement) {
    if (!this.doRender || !this.isMounted) {
      return h()
    }
    const name = `b-toast-${this._uid}`
    return h(
      Portal,
      {
        props: {
          name: name,
          to: this.computedToaster,
          order: this.order,
          slim: true,
          disabled: this.static
        }
      },
      [
        h(
          'div',
          {
            key: name,
            ref: 'btoast',
            staticClass: 'b-toast',
            class: this.bToastClasses,
            attrs: {
              id: this.safeId('_toast_outer'),
              role: this.isHiding ? null : this.isStatus ? 'status' : 'alert',
              'aria-live': this.isHiding ? null : this.isStatus ? 'polite' : 'assertive',
              'aria-atomic': this.isHiding ? null : 'true'
            }
          },
          [
            h(BVTransition, { props: { noFade: this.noFade }, on: this.transitionHandlers }, [
              this.localShow ? this.makeToast(h) : h()
            ])
          ]
        )
      ]
    )
  }
}

