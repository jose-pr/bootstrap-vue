import Vue from '../../utils/vue'
import idMixin from '../../mixins/id'
import normalizeSlotMixin from '../../mixins/normalize-slot'
import BVTransition from '../../utils/bv-transition'
import warn from '../../utils/warn'
import Component, { mixins } from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import { CreateElement } from 'vue';

const DEPRECATED_MSG = 'Setting prop "href" is deprecated. Use the <b-nav> component instead.'

@Component({})
export class BBaseTab extends Vue {
  @Prop() active:boolean = false;
  @Prop({default:'div'}) tag!:string;
  @Prop({default:''}) buttonId!:string;
  @Prop({default:''}) title!:string;
  @Prop() titleItemClass:string|string[]|null = null;
  @Prop() titleLinkClass:string|string[]|null = null;
  @Prop() headHtml:string|null = null;
  @Prop() disabled:boolean = false;
  @Prop() noBody:boolean = false;
  @Prop({ default: '#'}) href!:string;
  @Prop() lazy:boolean = false;
}
// @vue/component
@Component({})
export default class BTab extends mixins(idMixin, normalizeSlotMixin, BBaseTab){
  @Inject({default() {
    return {
      // Don't set a tab index if not rendered inside <b-tabs>
      noKeyNav: true
    }
  }}) bvTabs:any

  localActive= this.active && !this.disabled
  show= false

  @Watch('localActive')
  onLocalActive(newVal:boolean) {
    // Make 'active' prop work with `.sync` modifier
    this.$emit('update:active', newVal)
  }
  @Watch('active')
  onActive(newVal:boolean, oldVal:boolean) {
    if (newVal !== oldVal) {
      if (newVal) {
        // If activated post mount
        this.activate()
      } else {
        if (!this.deactivate()) {
          // Tab couldn't be deactivated, so we reset the synced active prop
          // Deactivation will fail if no other tabs to activate
          this.$emit('update:active', this.localActive)
        }
      }
    }
  }
  @Watch('disabled')
  onDisabled(newVal:boolean, oldVal:boolean) {
    if (newVal !== oldVal) {
      if (newVal && this.localActive && this.bvTabs.firstTab) {
        this.localActive = false
        this.bvTabs.firstTab()
      }
    }
  }

  get tabClasses() {
    return [
      {
        active: this.localActive,
        disabled: this.disabled,
        'card-body': this.bvTabs.card && !this.noBody
      },
      // Apply <b-tabs> `activeTabClass` styles when this tab is active
      this.localActive ? this.bvTabs.activeTabClass : null
    ]
  }
  get controlledBy() {
    return this.buttonId || this.safeId('__BV_tab_button__')
  }
  get computedNoFade() {
    return !(this.bvTabs.fade || false)
  }
  get computedLazy() {
    return this.bvTabs.lazy || this.lazy
  }
  get  _isTab() {
    // For parent sniffing of child
    return true
  }

  mounted() {
    // Inform b-tabs of our presence
    this.registerTab()
    // Initially show on mount if active and not disabled
    this.show = this.localActive
    // Deprecate use of `href` prop
    if (this.href && this.href !== '#') {
      /* istanbul ignore next */
      warn(`b-tab: ${DEPRECATED_MSG}`)
    }
  }
  updated() {
    // Force the tab button content to update (since slots are not reactive)
    // Only done if we have a title slot, as the title prop is reactive
    if (this.hasNormalizedSlot('title') && this.bvTabs.updateButton) {
      this.bvTabs.updateButton(this)
    }
  }
  destroyed() {
    // inform b-tabs of our departure
    this.unregisterTab()
  }

     // Private methods
  registerTab() {
    // Inform `b-tabs` of our presence
    this.bvTabs.registerTab && this.bvTabs.registerTab(this)
  }
  unregisterTab() {
    // Inform `b-tabs` of our departure
    this.bvTabs.unregisterTab && this.bvTabs.unregisterTab(this)
  }
  // Public methods
  activate() {
    if (this.bvTabs.activateTab && !this.disabled) {
      return this.bvTabs.activateTab(this)
    } else {
      // Not inside a <b-tabs> component or tab is disabled
      return false
    }
  }
  deactivate() {
    if (this.bvTabs.deactivateTab && this.localActive) {
      return this.bvTabs.deactivateTab(this)
    } else {
      // Not inside a <b-tabs> component or not active to begin with
      return false
    }
  }

  render(h:CreateElement) {
    let content = h(
      this.tag,
      {
        ref: 'panel',
        staticClass: 'tab-pane',
        class: this.tabClasses,
        directives: [
          {
            name: 'show',
            rawName: 'v-show',
            value: this.localActive,
            expression: 'localActive'
          } as any
        ],
        attrs: {
          role: 'tabpanel',
          id: this.safeId(),
          tabindex: this.localActive && !this.bvTabs.noKeyNav ? '-1' : null,
          'aria-hidden': this.localActive ? 'false' : 'true',
          'aria-labelledby': this.controlledBy || null
        }
      },
      // Render content lazily if requested
      [this.localActive || !this.computedLazy ? this.normalizeSlot('default') : h()]
    )
    return h(BVTransition, { props: { mode: 'out-in', noFade: this.computedNoFade } }, [content])
  }

}
