/*
 * Tooltip/Popover component mixin
 * Common props
 */

import observeDom from '../utils/observe-dom'
import { isElement, getById } from '../utils/dom'
import { isArray, isFunction, isObject, isString } from '../utils/inspect'
import { HTMLElement } from '../utils/safe-types'
import Component from 'vue-class-component';
import Vue from 'vue';
import { Prop, Watch } from 'vue-property-decorator';
import { booleanLiteral } from '@babel/types';
import { arrayIncludes } from '../utils/array';
import { Dict } from '..';
import { getComponentConfig } from '../utils/config';
import { delay } from 'q';
import ToolTip from '../utils/tooltip.class'


// --- Constants ---

const PLACEMENTS:Dict<string> = {
  top: 'top',
  topleft: 'topleft',
  topright: 'topright',
  right: 'right',
  righttop: 'righttop',
  rightbottom: 'rightbottom',
  bottom: 'bottom',
  bottomleft: 'bottomleft',
  bottomright: 'bottomright',
  left: 'left',
  lefttop: 'lefttop',
  leftbottom: 'leftbottom',
  auto: 'auto'
}

const OBSERVER_CONFIG = {
  subtree: true,
  childList: true,
  characterData: true,
  attributes: true,
  attributeFilter: ['class', 'style']
}

// @vue/component
@Component({})
export default class ToolpopMixin extends Vue {

  // String ID of element, or element/component reference  
  @Prop() target!:string|object|HTMLElement|Function
  @Prop({default:0}) offset!:number|string
  @Prop({default:false}) noFade!:boolean
  @Prop({default:null}) container!:string
  @Prop({default:false}) show!:Boolean
  @Prop({default:false}) disabled!:false

  @Prop({default:''}) title!:string
  @Prop({default:'top'}) placement!:string
  @Prop({default:'flip',validator(value) {
    return isArray(value) || arrayIncludes(['flip', 'clockwise', 'counterclockwise'], value)
  }}) fallbackPlacement!: string|string[]
  @Prop() delay!:number|string
  @Prop({default:'hover focus'}) triggers!:string|string[]
  @Prop() boundary!:string|HTMLElement
  @Prop() boundaryPadding!:number

  createToolpop():ToolTip|null{return null};

  // semaphore for preventing multiple show events
  localShow:boolean = false

  get baseConfig() {
      const cont = this.container
      let delay = isObject(this.delay) ? this.delay : parseInt(this.delay as string, 10) || 0
      return {
        // Title prop
        title: (this.title || '').trim() || '',
        // Content prop (if popover)
        content: ((this as any).content || '').trim() || '',
        // Tooltip/Popover placement
        placement: PLACEMENTS[this.placement] || 'auto',
        // Tooltip/popover fallback placemenet
        fallbackPlacement: this.fallbackPlacement || 'flip',
        // Container currently needs to be an ID with '#' prepended, if null then body is used
        container: cont ? (/^#/.test(cont) ? cont : `#${cont}`) : false,
        // boundariesElement passed to popper
        boundary: this.boundary,
        // boundariesElement padding passed to popper
        boundaryPadding: this.boundaryPadding,
        // Show/Hide delay
        delay: delay || 0,
        // Offset can be css distance. if no units, pixels are assumed
        offset: this.offset || 0,
        // Disable fade Animation?
        animation: !this.noFade,
        // Open/Close Trigger(s)
        trigger: isArray(this.triggers) ? this.triggers.join(' ') : this.triggers,
        // Callbacks so we can trigger events on component
        callbacks: {
          show: this.onShow,
          shown: this.onShown,
          hide: this.onHide,
          hidden: this.onHidden,
          enabled: this.onEnabled,
          disabled: this.onDisabled
        },
        html: false
      }
    }

    @Watch('show')
    onShowW(show:boolean, old:boolean) {
      if (show !== old) {
        show ? this.onOpen() : this.onClose()
      }
    }
    @Watch('disabled')
    onDisabledW(disabled:boolean, old:boolean) {
      if (disabled !== old) {
        disabled ? this.onDisable() : this.onEnable()
      }
    }
    @Watch('localShow')
    onLocalShow(show:boolean, old:boolean) {
      if (show !== this.show) {
        this.$emit('update:show', show)
      }
    }
  
  _toolpop:ToolTip|null = null;
  _obs_title:MutationObserver|null = null;
  _obs_content:MutationObserver|null = null;

  created() {
    // Create non-reactive property
    this._toolpop = null
    this._obs_title = null
    this._obs_content = null
  }
  mounted() {
    // We do this in a next tick to ensure DOM has rendered first
    this.$nextTick(() => {
      // Instantiate ToolTip/PopOver on target
      // The createToolpop method must exist in main component
      if (this.createToolpop()) {
        if (this.disabled) {
          // Initially disabled
          this.onDisable()
        }
        // Listen to open signals from others
        this.$on('open', this.onOpen)
        // Listen to close signals from others
        this.$on('close', this.onClose)
        // Listen to disable signals from others
        this.$on('disable', this.onDisable)
        // Listen to enable signals from others
        this.$on('enable', this.onEnable)
        // Observe content Child changes so we can notify popper of possible size change
        this.setObservers(true)
        // Set initially open state
        if (this.show) {
          this.onOpen()
        }
      }
    })
  }
  updated() {
    // If content/props changes, etc
    if (this._toolpop) {
      this._toolpop.updateConfig(this.getConfig())
    }
  }
  activated() /* istanbul ignore next: can't easily test in JSDOM */ {
    // Called when component is inside a <keep-alive> and component brought offline
    this.setObservers(true)
  }
  deactivated() /* istanbul ignore next: can't easily test in JSDOM */ {
    // Called when component is inside a <keep-alive> and component taken offline
    if (this._toolpop) {
      this.setObservers(false)
      this._toolpop.hide()
    }
  }
  beforeDestroy() {
    // Shutdown our local event listeners
    this.$off('open', this.onOpen)
    this.$off('close', this.onClose)
    this.$off('disable', this.onDisable)
    this.$off('enable', this.onEnable)
    this.setObservers(false)
    // bring our content back if needed
    this.bringItBack()
    if (this._toolpop) {
      this._toolpop.destroy()
      this._toolpop = null
    }
  }
 
    getConfig() {
      const cfg = { ...this.baseConfig }
      if (this.$refs.title && (this.$refs.title as HTMLElement).innerHTML.trim()) {
        // If slot has content, it overrides 'title' prop
        // We use the DOM node as content to allow components!
        cfg.title = this.$refs.title as any
        cfg.html = true
      }
      if (this.$refs.content && (this.$refs.content as HTMLElement).innerHTML.trim()) {
        // If slot has content, it overrides 'content' prop
        // We use the DOM node as content to allow components!
        cfg.content = this.$refs.content
        cfg.html = true
      }
      return cfg
    }
    onOpen() {
      if (this._toolpop && !this.localShow) {
        this.localShow = true
        this._toolpop.show()
      }
    }
    onClose(callback?:Function) {
      // What is callback for ? it is not documented
      /* istanbul ignore else */
      if (this._toolpop && this.localShow) {
        this._toolpop.hide(callback)
      } else if (isFunction(callback)) {
        // Is this even used?
        callback!()
      }
    }
    onDisable() {
      if (this._toolpop) {
        this._toolpop.disable()
      }
    }
    onEnable() {
      if (this._toolpop) {
        this._toolpop.enable()
      }
    }
    updatePosition() {
      /* istanbul ignore next: can't test in JSDOM until mutation observer is implemented */
      if (this._toolpop) {
        // Instruct popper to reposition popover if necessary
        this._toolpop.update()
      }
    }
    getTarget():HTMLElement|null {
      let target = this.target
      if (isFunction(target)) {
        /* istanbul ignore next */
        target = (target as Function)() as HTMLElement
      }
      /* istanbul ignore else */
      if (isString(target)) {
        // Assume ID of element
        return getById(target as string)
      } else if (isObject(target) && isElement((target as Vue).$el)) {
        // Component reference
        /* istanbul ignore next */
        return (target as Vue).$el as HTMLElement
      } else if (isObject(target) && isElement(target as HTMLElement)) {
        // Element reference
        /* istanbul ignore next */
        return target as HTMLElement
      }
      /* istanbul ignore next */
      return null
    }
    // Callbacks called by Tooltip/Popover class instance
    onShow(evt:Event) {
      this.$emit('show', evt)
      this.localShow = !(evt && evt.defaultPrevented)
    }
    onShown(evt:Event) {
      this.setObservers(true)
      this.$emit('shown', evt)
      this.localShow = true
    }
    onHide(evt:Event) {
      this.$emit('hide', evt)
      this.localShow = !!(evt && evt.defaultPrevented)
    }
    onHidden(evt:Event) {
      this.setObservers(false)
      // bring our content back if needed to keep Vue happy
      // Tooltip class will move it back to tip when shown again
      this.bringItBack()
      this.$emit('hidden', evt)
      this.localShow = false
    }
    onEnabled(evt:Event) {
      /* istanbul ignore next */
      if (!evt || evt.type !== 'enabled') {
        // Prevent possible endless loop if user mistakenly fires enabled instead of enable
        return
      }
      this.$emit('update:disabled', false)
      this.$emit('disabled')
    }
    onDisabled(evt:Event) {
      /* istanbul ignore next */
      if (!evt || evt.type !== 'disabled') {
        // Prevent possible endless loop if user mistakenly fires disabled instead of disable
        return
      }
      this.$emit('update:disabled', true)
      this.$emit('enabled')
    }
    bringItBack() {
      // bring our content back if needed to keep Vue happy
      if (this.$el && this.$refs.title) {
        this.$el.appendChild(this.$refs.title as HTMLElement)
      }
      if (this.$el && this.$refs.content) {
        this.$el.appendChild(this.$refs.content as HTMLElement)
      }
    }
    setObservers(on:boolean) {
      if (on) {
        if (this.$refs.title) {
          this._obs_title = observeDom(
            this.$refs.title as HTMLElement,
            this.updatePosition.bind(this),
            OBSERVER_CONFIG
          )
        }
        if (this.$refs.content) {
          this._obs_content = observeDom(
            this.$refs.content as HTMLElement,
            this.updatePosition.bind(this),
            OBSERVER_CONFIG
          )
        }
      } else {
        if (this._obs_title) {
          this._obs_title.disconnect()
          this._obs_title = null
        }
        if (this._obs_content) {
          this._obs_content.disconnect()
          this._obs_content = null
        }
      }
    }
  }

