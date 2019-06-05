import Vue from '../../utils/vue'
import KeyCodes from '../../utils/key-codes'
import noop from '../../utils/noop'
import observeDom from '../../utils/observe-dom'
import { getComponentConfig } from '../../utils/config'
import {
  selectAll,
  reflow,
  addClass,
  removeClass,
  setAttr,
  eventOn,
  eventOff
} from '../../utils/dom'
import { isBrowser, hasTouchSupport, hasPointerEventSupport } from '../../utils/env'
import { isUndefined } from '../../utils/inspect'
import idMixin from '../../mixins/id'
import normalizeSlotMixin from '../../mixins/normalize-slot'
import { Dict } from '../..';
import Component, { mixins } from 'vue-class-component';
import { Model, Prop, Watch, Provide } from 'vue-property-decorator';
import { CreateElement, VNode } from 'vue';

const NAME = 'BCarousel'

// Slide directional classes
const DIRECTION:Dict<{dirClass:string,overlayClass:string}> = {
  next: {
    dirClass: 'carousel-item-left',
    overlayClass: 'carousel-item-next'
  },
  prev: {
    dirClass: 'carousel-item-right',
    overlayClass: 'carousel-item-prev'
  }
}

// Fallback Transition duration (with a little buffer) in ms
const TRANS_DURATION = 600 + 50

// Time for mouse compat events to fire after touch
const TOUCH_EVENT_COMPAT_WAIT = 500

// Number of pixels to consider touch move a swipe
const SWIPE_THRESHOLD = 40

// PointerEvent pointer types
 const PointerType:Dict<string>= {
  TOUCH:'touch',
  PEN:'pen'
}

// Transition Event names
const TransitionEndEvents:Dict<string>= {
  WebkitTransition: 'webkitTransitionEnd',
  MozTransition: 'transitionend',
  OTransition: 'otransitionend oTransitionEnd',
  transition: 'transitionend'
}

const EventOptions = { passive: true, capture: false }

// Return the browser specific transitionEnd event name
function getTransitionEndEvent(el:HTMLElement):string|null {
  for (const name in TransitionEndEvents) {
    if (!isUndefined(el.style.getPropertyValue(name))) {
      return TransitionEndEvents[name]
    }
  }
  // fallback
  /* istanbul ignore next */
  return null
}

// @vue/component
@Component({})
export class BCarousel extends mixins(idMixin,normalizeSlotMixin) {
  @Model('input') value:number=0;

  @Provide() bvCarousel = this;

  @Prop({default:() => getComponentConfig(NAME, 'labelPrev')}) labelPrev!:string;
  @Prop({default:() => getComponentConfig(NAME, 'labelNext')}) labelNext!:string;
  @Prop({default:() => getComponentConfig(NAME, 'labelGotoSlide')}) labelGotoSlide!:string;
  @Prop({default:() => getComponentConfig(NAME, 'labelIndicators')}) labelIndicators!:string;
  @Prop({default:5000}) interval!:number|string
  @Prop({default:false}) indicators!:boolean
  @Prop({default:false}) controls!:boolean
  @Prop({default:false}) noAnimation!:boolean
  @Prop({default:false}) fade!:boolean
  @Prop({default:false}) noTouch!:boolean
  @Prop({default:false}) noHoverPause!:boolean
  @Prop() imgWidth!:number|string
  @Prop() imgHeight!:number|string
  @Prop() background!:string

  index:number = this.value || 0
  isSliding:boolean = false
  transitionEndEvent:string|null = null
  slides:HTMLElement[] = []
  direction:any =  null
  isPaused:boolean = !(parseInt(this.interval as string, 10) > 0)
  // Touch event handling values
  touchStartX:number = 0
  touchDeltaX:number = 0

  _intervalId!:number|null|NodeJS.Timeout;
  _animationTimeout!:null|number;
  _touchTimeout!:null|number;

  @Watch('value')
  onValue(newVal:number, oldVal:number) {
    if (newVal !== oldVal) {
      this.setSlide(newVal)
    }
  }
  @Watch('interval')
  onInterval(newVal:number, oldVal:number) {
    if (newVal === oldVal) {
      /* istanbul ignore next */
      return
    }
    if (!newVal) {
      // Pausing slide show
      this.pause(false)
    } else {
      // Restarting or Changing interval
      this.pause(true)
      this.start(false)
    }
  }
  @Watch('isPaused')
  onIsPaused(newVal:boolean, oldVal:boolean) {
    if (newVal !== oldVal) {
      this.$emit(newVal ? 'paused' : 'unpaused')
    }
  }
  @Watch('index')
  onIndex(to:number, from:number) {
    if (to === from || this.isSliding) {
      /* istanbul ignore next */
      return
    }
    this.doSlide(to, from)
  }

     // Set slide
     setSlide(slide:number, direction:string|null = null) {
      // Don't animate when page is not visible
      /* istanbul ignore if: difficult to test */
      if (isBrowser && document.visibilityState && document.hidden) {
        return
      }
      const len = this.slides.length
      // Don't do anything if nothing to slide to
      if (len === 0) {
        return
      }
      // Don't change slide while transitioning, wait until transition is done
      if (this.isSliding) {
        // Schedule slide after sliding complete
        this.$once('sliding-end', () => this.setSlide(slide, direction))
        return
      }
      this.direction = direction
      // Make sure we have an integer (you never know!)
      slide = Math.floor(slide)
      // Set new slide index. Wrap around if necessary
      this.index = slide >= len ? 0 : slide >= 0 ? slide : len - 1
    }
    // Previous slide
    prev() {
      this.setSlide(this.index - 1, 'prev')
    }
    // Next slide
    next() {
      this.setSlide(this.index + 1, 'next')
    }
    // Pause auto rotation
    pause(evt?:boolean) {
      if (!evt) {
        this.isPaused = true
      }
      if (this._intervalId) {
        clearInterval(this._intervalId as NodeJS.Timeout)
        this._intervalId = null
      }
    }
    // Start auto rotate slides
    start(evt?:boolean) {
      if (!evt) {
        this.isPaused = false
      }
      /* istanbul ignore next: most likely will never happen, but just in case */
      if (this._intervalId) {
        clearInterval(this._intervalId as NodeJS.Timeout)
        this._intervalId = null
      }
      // Don't start if no interval, or less than 2 slides
      if (this.interval && this.slides.length > 1) {
        this._intervalId = setInterval(this.next, Math.max(1000, this.interval as number))
      }
    }
    // Restart auto rotate slides when focus/hover leaves the carousel
    restart(evt:Event) /* istanbul ignore next: difficult to test */ {
      if (!this.$el.contains(document.activeElement)) {
        this.start()
      }
    }
    doSlide(to:number, from:number) {
      const isCycling = Boolean(this.interval)
      // Determine sliding direction
      let direction = this.calcDirection(this.direction, from, to)
      const overlayClass = direction.overlayClass
      const dirClass = direction.dirClass
      // Determine current and next slides
      const currentSlide = this.slides[from]
      const nextSlide = this.slides[to]
      // Don't do anything if there aren't any slides to slide to
      if (!currentSlide || !nextSlide) {
        /* istanbul ignore next */
        return
      }
      // Start animating
      this.isSliding = true
      if (isCycling) {
        this.pause(false)
      }
      this.$emit('sliding-start', to)
      // Update v-model
      this.$emit('input', this.index)
      if (this.noAnimation) {
        addClass(nextSlide, 'active')
        removeClass(currentSlide, 'active')
        this.isSliding = false
        // Notify ourselves that we're done sliding (slid)
        this.$nextTick(() => this.$emit('sliding-end', to))
      } else {
        addClass(nextSlide, overlayClass)
        // Trigger a reflow of next slide
        reflow(nextSlide)
        addClass(currentSlide, dirClass)
        addClass(nextSlide, dirClass)
        // Transition End handler
        let called = false
        /* istanbul ignore next: difficult to test */
        const onceTransEnd = (evt:Event) => {
          if (called) {
            return
          }
          called = true
          /* istanbul ignore if: transition events cant be tested in JSDOM */
          if (this.transitionEndEvent) {
            const events = this.transitionEndEvent.split(/\s+/)
            events.forEach(evt => eventOff(currentSlide, evt, onceTransEnd, EventOptions))
          }
          this._animationTimeout = null
          removeClass(nextSlide, dirClass)
          removeClass(nextSlide, overlayClass)
          addClass(nextSlide, 'active')
          removeClass(currentSlide, 'active')
          removeClass(currentSlide, dirClass)
          removeClass(currentSlide, overlayClass)
          setAttr(currentSlide, 'aria-current', 'false')
          setAttr(nextSlide, 'aria-current', 'true')
          setAttr(currentSlide, 'aria-hidden', 'true')
          setAttr(nextSlide, 'aria-hidden', 'false')
          this.isSliding = false
          this.direction = null
          // Notify ourselves that we're done sliding (slid)
          this.$nextTick(() => this.$emit('sliding-end', to))
        }
        // Set up transitionend handler
        /* istanbul ignore if: transition events cant be tested in JSDOM */
        if (this.transitionEndEvent) {
          const events = this.transitionEndEvent.split(/\s+/)
          events.forEach(event => eventOn(currentSlide, event, onceTransEnd, EventOptions))
        }
        // Fallback to setTimeout()
        this._animationTimeout = setTimeout(onceTransEnd, TRANS_DURATION)
      }
      if (isCycling) {
        this.start(false)
      }
    }
    // Update slide list
    updateSlides() {
      this.pause(true)
      // Get all slides as DOM elements
      this.slides = selectAll('.carousel-item', this.$refs.inner as Element) as HTMLElement[]
      const numSlides = this.slides.length
      // Keep slide number in range
      const index = Math.max(0, Math.min(Math.floor(this.index), numSlides - 1))
      this.slides.forEach((slide, idx) => {
        const n = idx + 1
        if (idx === index) {
          addClass(slide, 'active')
          setAttr(slide, 'aria-current', 'true')
        } else {
          removeClass(slide, 'active')
          setAttr(slide, 'aria-current', 'false')
        }
        setAttr(slide, 'aria-posinset', String(n))
        setAttr(slide, 'aria-setsize', String(numSlides))
      })
      // Set slide as active
      this.setSlide(index)
      this.start(this.isPaused)
    }
    calcDirection(direction:string|null = null, curIndex = 0, nextIndex = 0) {
      if (!direction) {
        return nextIndex > curIndex ? DIRECTION.next : DIRECTION.prev
      }
      return DIRECTION[direction]
    }
    handleClick(evt:KeyboardEvent, fn:Function) {
      const keyCode = evt.keyCode
      if (evt.type === 'click' || keyCode === KeyCodes.SPACE || keyCode === KeyCodes.ENTER) {
        evt.preventDefault()
        evt.stopPropagation()
        fn()
      }
    }
    handleSwipe() /* istanbul ignore next: JSDOM doesn't support touch events */ {
      const absDeltaX = Math.abs(this.touchDeltaX)
      if (absDeltaX <= SWIPE_THRESHOLD) {
        return
      }
      const direction = absDeltaX / this.touchDeltaX
      if (direction > 0) {
        // Swipe left
        this.prev()
      } else if (direction < 0) {
        // Swipe right
        this.next()
      }
    }
    touchStart(evt:PointerEvent&TouchEvent) /* istanbul ignore next: JSDOM doesn't support touch events */ {
      if (hasPointerEventSupport && PointerType[evt.pointerType.toUpperCase()]) {
        this.touchStartX = evt.clientX
      } else if (!hasPointerEventSupport) {
        this.touchStartX = evt.touches[0].clientX
      }
    }
    touchMove(evt:TouchEvent) /* istanbul ignore next: JSDOM doesn't support touch events */ {
      // Ensure swiping with one touch and not pinching
      if (evt.touches && evt.touches.length > 1) {
        this.touchDeltaX = 0
      } else {
        this.touchDeltaX = evt.touches[0].clientX - this.touchStartX
      }
    }
    touchEnd(evt:PointerEvent) /* istanbul ignore next: JSDOM doesn't support touch events */ {
      if (hasPointerEventSupport && PointerType[evt.pointerType.toUpperCase()]) {
        this.touchDeltaX = evt.clientX - this.touchStartX
      }
      this.handleSwipe()
      // If it's a touch-enabled device, mouseenter/leave are fired as
      // part of the mouse compatibility events on first tap - the carousel
      // would stop cycling until user tapped out of it;
      // here, we listen for touchend, explicitly pause the carousel
      // (as if it's the second time we tap on it, mouseenter compat event
      // is NOT fired) and after a timeout (to allow for mouse compatibility
      // events to fire) we explicitly restart cycling
      this.pause(false)
      if (this._touchTimeout) {
        clearTimeout(this._touchTimeout)
      }
      this._touchTimeout = setTimeout(
        this.start,
        TOUCH_EVENT_COMPAT_WAIT + Math.max(1000, this.interval as number)
      )
    }

    created() {
      // Create private non-reactive props
      this._intervalId = null
      this._animationTimeout = null
      this._touchTimeout = null
      // Set initial paused state
      this.isPaused = !(parseInt(this.interval as string, 10) > 0)
    }
    mounted() {
      // Cache current browser transitionend event name
      this.transitionEndEvent = getTransitionEndEvent(this.$el as HTMLElement) || null
      // Get all slides
      this.updateSlides()
      // Observe child changes so we can update slide list
      observeDom(this.$refs.inner as Element, this.updateSlides.bind(this), {
        subtree: false,
        childList: true,
        attributes: true,
        attributeFilter: ['id']
      })
    }
    beforeDestroy() {
      clearTimeout(this._animationTimeout as number)
      clearTimeout(this._touchTimeout as number)
      clearInterval(this._intervalId as number)
      this._intervalId = null
      this._animationTimeout = null
      this._touchTimeout = null
    }  
    render(h:CreateElement) {
      // Wrapper for slides
      const inner = h(
        'div',
        {
          ref: 'inner',
          class: ['carousel-inner'],
          attrs: {
            id: this.safeId('__BV_inner_'),
            role: 'list'
          }
        },
        [this.normalizeSlot('default')]
      )
  
      // Prev and next controls
      let controls = [h()] as VNode[]
      if (this.controls) {
        controls = [
          h(
            'a',
            {
              class: ['carousel-control-prev'],
              attrs: { href: '#', role: 'button', 'aria-controls': this.safeId('__BV_inner_') },
              on: {
                click: (evt:KeyboardEvent) => {
                  this.handleClick(evt, this.prev)
                },
                keydown: (evt:KeyboardEvent) => {
                  this.handleClick(evt, this.prev)
                }
              }
            },
            [
              h('span', { class: ['carousel-control-prev-icon'], attrs: { 'aria-hidden': 'true' } }),
              h('span', { class: ['sr-only'] }, [this.labelPrev])
            ]
          ),
          h(
            'a',
            {
              class: ['carousel-control-next'],
              attrs: { href: '#', role: 'button', 'aria-controls': this.safeId('__BV_inner_') },
              on: {
                click: (evt:KeyboardEvent) => {
                  this.handleClick(evt, this.next)
                },
                keydown: (evt:KeyboardEvent) => {
                  this.handleClick(evt, this.next)
                }
              }
            },
            [
              h('span', { class: ['carousel-control-next-icon'], attrs: { 'aria-hidden': 'true' } }),
              h('span', { class: ['sr-only'] }, [this.labelNext])
            ]
          )
        ]
      }
  
      // Indicators
      const indicators = h(
        'ol',
        {
          class: ['carousel-indicators'],
          directives: [
            { name: 'show', rawName: 'v-show', value: this.indicators, expression: 'indicators' } as any
          ],
          attrs: {
            id: this.safeId('__BV_indicators_'),
            'aria-hidden': this.indicators ? 'false' : 'true',
            'aria-label': this.labelIndicators,
            'aria-owns': this.safeId('__BV_inner_')
          }
        },
        this.slides.map((slide, n) => {
          return h('li', {
            key: `slide_${n}`,
            class: { active: n === this.index },
            attrs: {
              role: 'button',
              id: this.safeId(`__BV_indicator_${n + 1}_`),
              tabindex: this.indicators ? '0' : '-1',
              'aria-current': n === this.index ? 'true' : 'false',
              'aria-label': `${this.labelGotoSlide} ${n + 1}`,
              'aria-describedby': this.slides[n].id || null,
              'aria-controls': this.safeId('__BV_inner_')
            },
            on: {
              click: (evt:KeyboardEvent) => {
                this.handleClick(evt, () => {
                  this.setSlide(n)
                })
              },
              keydown: (evt:KeyboardEvent) => {
                this.handleClick(evt, () => {
                  this.setSlide(n)
                })
              }
            }
          })
        })
      )
  
      const on:Dict<(evt:any)=>void> = {
        mouseenter: this.noHoverPause ? noop : this.pause,
        mouseleave: this.noHoverPause ? noop : this.restart,
        focusin: this.pause,
        focusout: this.restart,
        keydown: (evt:KeyboardEvent) => {
          if (/input|textarea/i.test((evt.target! as Element).tagName)) {
            /* istanbul ignore next */
            return
          }
          const keyCode = evt.keyCode
          if (keyCode === KeyCodes.LEFT || keyCode === KeyCodes.RIGHT) {
            evt.preventDefault()
            evt.stopPropagation()
            this[keyCode === KeyCodes.LEFT ? 'prev' : 'next']()
          }
        }
      }
      // Touch support event handlers for environment
      if (!this.noTouch && hasTouchSupport) {
        // Attach appropriate listeners (prepend event name with '&' for passive mode)
        /* istanbul ignore next: JSDOM doesn't support touch events */
        if (hasPointerEventSupport) {
          on['&pointerdown'] = this.touchStart
          on['&pointerup'] = this.touchEnd
        } else {
          on['&touchstart'] = this.touchStart
          on['&touchmove'] = this.touchMove
          on['&touchend'] = this.touchEnd
        }
      }
  
      // Return the carousel
      return h(
        'div',
        {
          staticClass: 'carousel',
          class: {
            slide: !this.noAnimation,
            'carousel-fade': !this.noAnimation && this.fade,
            'pointer-event': !this.noTouch && hasTouchSupport && hasPointerEventSupport
          },
          style: { background: this.background },
          attrs: {
            role: 'region',
            id: this.safeId(),
            'aria-busy': this.isSliding ? 'true' : 'false'
          },
          on
        },
        [inner, controls, indicators]
      )
    }


}
export default Vue.extend({



})
