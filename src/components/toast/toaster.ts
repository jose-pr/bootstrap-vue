import Vue from '../../utils/vue'
import { PortalTarget, Wormhole } from 'portal-vue'
import warn from '../../utils/warn'
import { getComponentConfig } from '../../utils/config'
import { removeClass, requestAF } from '../../utils/dom'
import Component from 'vue-class-component';
import { CreateElement } from 'vue';
import { Prop } from 'vue-property-decorator';
import { BvComponent } from '../..';

// --- Constants ---

const NAME = 'BToaster'
/*
export const props = {
  name: {
    type: String,
    required: true
  },
  ariaLive: {
    type: String,
    default: () => getComponentConfig(NAME, 'ariaLive')
  },
  ariaAtomic: {
    type: String,
    default: () => getComponentConfig(NAME, 'ariaAtomic') // Allowed: 'true' or 'false' or null
  },
  role: {
    // Aria role
    type: String,
    default: () => getComponentConfig(NAME, 'role')
  }
  /*
  transition: {
    type: [Boolean, String, Object],
    default: false
  }
  
} */

// @vue/component
@Component({})
export class DefaultTransition extends Vue{
  name:string = 'b-toaster'

  onAfterEnter(el:HTMLElement) {
    // Handle bug where enter-to class is not removed.
    // Bug is related to portal-vue and transition-groups.
    requestAF(() => {
      removeClass(el, `${this.name}-enter-to`)
      // The *-move class is also stuck on elements that moved,
      // but there are no javascript hooks to handle after move.
    })
  }

  render(h:CreateElement) {
    return h(
      'transition-group',
      {
        props: { tag: 'div', name: this.name },
        on: { afterEnter: this.onAfterEnter }
      },
      this.$slots.default
    )
  }
}

// @vue/component
@Component({})
export default class BToaster extends Vue implements BvComponent{

  @Prop({required:true}) name!:string
  @Prop({default:() => getComponentConfig(NAME, 'ariaLive') }) ariaLive!:string
  @Prop({default:() => getComponentConfig(NAME, 'ariaAtomic') }) ariaAtomic!:string
  @Prop({default:() => getComponentConfig(NAME, 'role') }) role!:string
 // @Prop({default:false}) transition!:boolean|string|{}

  // We don't render on SSR or if a an existing target found
  doRender:boolean = false
  dead:boolean = false
  // Toaster names cannot change once created
  staticName:string = this.name

  beforeMount() {
    this.staticName = this.name
    /* istanbul ignore if */
    if (Wormhole.hasTarget(this.staticName)) {
      warn(`b-toaster: A <portal-target> with name '${this.name}' already exists in the document.`)
      this.dead = true
    } else {
      this.doRender = true
      this.$once('hook:beforeDestroy', () => {
        // Let toasts made with `this.$bvToast.toast()` know that this toaster
        // is being destroyed and should should also destroy/hide themselves
        this.$root.$emit('bv::toaster::destroyed', this.staticName)
      })
    }
  }

  destroyed() {
    // Remove from DOM if needed
    /* istanbul ignore next: difficult to test */
    if (this.$el && this.$el.parentNode) {
      this.$el.parentNode.removeChild(this.$el)
    }
  }

  render(h:CreateElement) {
    let $toaster = h('div', { class: ['d-none', { 'b-dead-toaster': this.dead }] })
    if (this.doRender) {
      const $target = h(PortalTarget, {
        staticClass: 'b-toaster-slot',
        props: {
          name: this.staticName,
          multiple: true,
          tag: 'div',
          slim: false,
          // transition: this.transition || DefaultTransition
          transition: DefaultTransition
        }
      })
      $toaster = h(
        'div',
        {
          staticClass: 'b-toaster',
          class: [this.staticName],
          attrs: {
            id: this.staticName,
            role: this.role || null, // Fallback to null to make sure attribute doesn't exist
            'aria-live': this.ariaLive,
            'aria-atomic': this.ariaAtomic
          }
        },
        [$target]
      )
    }
    return $toaster
  }
}
