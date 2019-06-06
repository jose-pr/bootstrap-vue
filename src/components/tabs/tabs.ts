import Vue from '../../utils/vue'
import BLink, { BvLink } from '../link/link'
import BNav, { props as BNavProps, BvNav } from '../nav/nav'
import { requestAF, selectAll } from '../../utils/dom'
import KeyCodes from '../../utils/key-codes'
import { arrayIncludes, concat } from '../../utils/array'
import { omit } from '../../utils/object'
import idMixin from '../../mixins/id'
import normalizeSlotMixin from '../../mixins/normalize-slot'
import BTab from './tab';
import { VueClass } from '@vue/test-utils';
import { Inject, Prop, Component, Model, Provide, Watch } from 'vue-property-decorator';
import { CreateElement, VNode } from 'vue';
import { mixins } from 'vue-class-component';
import { ElementClass, NumberLike } from '../..';

// -- Constants --

const navProps = omit(BNavProps, ['tabs', 'isNavBar']) as Omit<BvNav, "tabs" | "isNavBar">

// -- Utils --

// Filter function to filter out disabled tabs
const notDisabled = (tab: BTab) => !tab.disabled

// --- Helper components ---
interface BvTabButtonHelper {
  tab: BTab,
  tabs: BTab[],
  id: string,
  controls: string,
  tabIndex: number,
  posInSet: number,
  setSize: number,
  noKeyNav: boolean
}
// @vue/component
class BTabButtonHelper extends Vue {
  @Inject({
    default() {
      return {}
    }
  }) bvTabs: any

  @Prop() tab: BTab | null = null
  @Prop({ default() { return [] } }) tabs!: BTab[]
  @Prop() id: string | null = null
  @Prop() controls: string | null = null
  @Prop() tabIndex: number | null = null
  @Prop() posInSet: number | null = null
  @Prop() setSize: number | null = null
  @Prop() noKeyNav: boolean = false

  focus() {
    if (this.$refs && this.$refs.link && (this.$refs.link as HTMLElement).focus) {
      (this.$refs.link as HTMLElement).focus()
    }
  }
  handleEvt(evt: Event & KeyboardEvent) {
    function stop() {
      evt.preventDefault()
      evt.stopPropagation()
    }
    if (this.tab!.disabled) {
      /* istanbul ignore next */
      return
    }
    const type = evt.type
    const key = evt.keyCode
    const shift = evt.shiftKey
    if (type === 'click') {
      stop()
      this.$emit('click', evt)
    } else if (type === 'keydown' && !this.noKeyNav && key === KeyCodes.SPACE) {
      // In keynav mode, SPACE press will also trigger a click/select
      stop()
      this.$emit('click', evt)
    } else if (type === 'keydown' && !this.noKeyNav) {
      // For keyboard navigation
      if (key === KeyCodes.UP || key === KeyCodes.LEFT || key === KeyCodes.HOME) {
        stop()
        if (shift || key === KeyCodes.HOME) {
          this.$emit('first', evt)
        } else {
          this.$emit('prev', evt)
        }
      } else if (key === KeyCodes.DOWN || key === KeyCodes.RIGHT || key === KeyCodes.END) {
        stop()
        if (shift || key === KeyCodes.END) {
          this.$emit('last', evt)
        } else {
          this.$emit('next', evt)
        }
      }
    }
  }

  render(h: CreateElement) {
    const link = h(
      BLink,
      {
        ref: 'link',
        staticClass: 'nav-link',
        class: [
          {
            active: this.tab!.localActive && !this.tab!.disabled,
            disabled: this.tab!.disabled
          },
          this.tab!.titleLinkClass,
          // Apply <b-tabs> `activeNavItemClass` styles when the tab is active
          this.tab!.localActive ? this.bvTabs.activeNavItemClass : null
        ],
        props: {
          href: this.tab!.href, // To be deprecated to always be '#'
          disabled: this.tab!.disabled
        },
        attrs: {
          role: 'tab',
          id: this.id,
          // Roving tab index when keynav enabled
          tabindex: this.tabIndex,
          'aria-selected': this.tab!.localActive && !this.tab!.disabled ? 'true' : 'false',
          'aria-setsize': this.setSize,
          'aria-posinset': this.posInSet,
          'aria-controls': this.controls
        },
        on: {
          click: this.handleEvt,
          keydown: this.handleEvt
        }
      },
      [this.tab!.normalizeSlot('title') || this.tab!.title]
    )
    return h(
      'li',
      {
        staticClass: 'nav-item',
        class: [this.tab!.titleItemClass],
        attrs: { role: 'presentation' }
      },
      [link]
    )
  }
}

// @vue/component
@Component({})
export default class BTabs extends mixins(idMixin, normalizeSlotMixin) implements BvNav {

  @Model('input') value: NumberLike = 0;

  //BvNavProps
  @Prop({ default: 'div' }) tag!: string;
  @Prop() fill: boolean = false;
  @Prop() justified: boolean = false;
  @Prop() align: string = '';
  @Prop() pills: boolean = false;
  @Prop() vertical: boolean = false;
  @Prop() small: boolean = false;
  //Props    
  @Prop() card: boolean = false;
  @Prop() bottom: boolean = false;
  @Prop() end: boolean = false;
  @Prop() noFade: boolean = false;
  @Prop() noNavStyle: boolean = false;
  @Prop() noKeyNav: boolean = false;
  @Prop() lazy: boolean = false;
  @Prop() contentClass: ElementClass = [];
  @Prop() navClass: ElementClass = [];
  @Prop() navWrapperClass: ElementClass = [];
  @Prop() activeNavItemClass: ElementClass = [];
  @Prop() activeTabClass: ElementClass = [];

  @Provide() bvTabs = this;

  currentTab: number = NaN //tabIdx,
  tabs: BTab[] = []
  registeredTabs: BTab[] = []
  isMounted = false

  fade() {
    // This computed prop is sniffed by the tab child
    return !this.noFade
  }
  navStyle() {
    return this.pills ? 'pills' : 'tabs'
  }
  localNavClass() {
    let classes = []
    if (this.card) {
      if (this.vertical) {
        classes.push('card-header', 'h-100', 'border-bottom-0', 'rounded-0')
      } else {
        classes.push(`card-header-${this.navStyle}`)
      }
    }
    return [...classes, this.navClass]
  }
  
  @Watch('currentTab')
  onCurrentTab(val:number, old:number) {
    let index = -1
    // Ensure only one tab is active at most
    this.tabs.forEach((tab, idx) => {
      if (val === idx && !tab.disabled) {
        tab.localActive = true
        index = idx
      } else {
        tab.localActive = false
      }
    })
    // Update the v-model
    this.$emit('input', index)
  }
  @Watch('value')
  onValue(val:NumberLike, old:NumberLike) {
    if (val !== old) {
      val = parseInt(val as string, 10)
      val = isNaN(val) ? -1 : val
      old = parseInt(old as string, 10) || 0
      const tabs = this.tabs
      if (tabs[val] && !tabs[val].disabled) {
        this.currentTab = val
      } else {
        // Try next or prev tabs
        if (val < old) {
          this.previousTab()
        } else {
          this.nextTab()
        }
      }
    }
  }
  @Watch('registeredTabs')
  onRegisteredTabs(newVal:BTab[], oldVal:BTab[]) {
    // Each b-tab will register/unregister itself.
    // We use this to detect when tabs are added/removed
    // to trigger the update of the tabs.
    this.$nextTick(() => {
      requestAF(() => {
        this.updateTabs()
      })
    })
  }
  @Watch('isMounted')
  onIsMounted(newVal:boolean, oldVal:boolean) {
    // Trigger an update after mounted.  Needed
    // for tabs inside lazy modals.
    if (newVal) {
      requestAF(() => {
        this.updateTabs()
      })
    }
  }

  created() {
    let tabIdx = parseInt(this.value as any, 10)
    this.currentTab = isNaN(tabIdx) ? -1 : tabIdx
    // For SSR and to make sure only a single tab is shown on mount
    // We wrap this in a `$nextTick()` to ensure the child tabs have been created
    this.$nextTick(() => {
      this.updateTabs()
    })
  }
  mounted() {
    // Call `updateTabs()` just in case...
    this.updateTabs()
    this.$nextTick(() => {
      // Flag we are now mounted and to switch to DOM for tab probing.
      // As this.$slots.default appears to lie about component instances
      // after b-tabs is destroyed and re-instantiated.
      // And this.$children does not respect DOM order.
      this.isMounted = true
    })
  }
  deactivated() /* istanbul ignore next */ {
    this.isMounted = false
  }
  activated() /* istanbul ignore next */ {
    let tabIdx = parseInt(this.value as string, 10)
    this.currentTab = isNaN(tabIdx) ? -1 : tabIdx
    this.$nextTick(() => {
      this.updateTabs()
      this.isMounted = true
    })
  }
  destroyed() {
    // Ensure no references to child instances exist
    this.tabs = []
  }

  registerTab(tab:BTab) {
    if (!arrayIncludes(this.registeredTabs, tab)) {
      this.registeredTabs.push(tab)
      tab.$once('hook:destroyed', () => {
        this.unregisterTab(tab)
      })
    }
  }
  unregisterTab(tab:BTab) {
    this.registeredTabs = this.registeredTabs.slice().filter(t => t !== tab)
  }
  getTabs() {
    let tabs = []
    if (!this.isMounted) {
      tabs = (this.normalizeSlot('default') as VNode[]|| []).map(vnode => vnode.componentInstance)
    } else {
      // We rely on the DOM when mounted to get the list of tabs,
      // as this.$slots.default appears to lie about current tab vm instances, after being
      // destroyed and then re-intantiated (cached vNodes which don't reflect correct vm)
      // Fix for https://github.com/bootstrap-vue/bootstrap-vue/issues/3361
      tabs = selectAll(`#${this.safeId('_BV_tab_container_')} > .tab-pane`, this.$el)
        .map(el => (el as any).__vue__)
        .filter(Boolean)
        // The VM attached to the element is `transition` so we need the $parent to get tab
        .map(vm => vm.$parent)
    }
    return tabs.filter(tab => tab && tab._isTab)
  }
  // Update list of <b-tab> children
  updateTabs() {
    // Probe tabs
    const tabs = this.getTabs()

    // Find *last* active non-disabled tab in current tabs
    // We trust tab state over currentTab, in case tabs were added/removed/re-ordered
    let tabIndex = tabs.indexOf(
      tabs
        .slice()
        .reverse()
        .find(tab => tab.localActive && !tab.disabled)
    )

    // Else try setting to currentTab
    if (tabIndex < 0) {
      const currentTab = this.currentTab
      if (currentTab >= tabs.length) {
        // Handle last tab being removed, so find the last non-disabled tab
        tabIndex = tabs.indexOf(
          tabs
            .slice()
            .reverse()
            .find(notDisabled)
        )
      } else if (tabs[currentTab] && !tabs[currentTab].disabled) {
        // Current tab is not disabled
        tabIndex = currentTab
      }
    }

    // Else find *first* non-disabled tab in current tabs
    if (tabIndex < 0) {
      tabIndex = tabs.indexOf(tabs.find(notDisabled))
    }

    // Set the current tab state to active
    tabs.forEach((tab, idx) => {
      // tab.localActive = idx === tabIndex && !tab.disabled
      tab.localActive = false
    })
    if (tabs[tabIndex]) {
      tabs[tabIndex].localActive = true
    }

    // Update the array of tab children
    this.tabs = tabs
    // Set the currentTab index (can be -1 if no non-disabled tabs)
    this.currentTab = tabIndex
  }
  // Find a button that controls a tab, given the tab reference
  // Returns the button vm instance
  getButtonForTab(tab?:BTab) {
    return (this.$refs.buttons as BTabButtonHelper[]|| []).find(btn => btn.tab === tab)
  }
  // Force a button to re-render it's content, given a <b-tab> instance
  // Called by <b-tab> on `update()`
  updateButton(tab?:BTab) {
    const button = this.getButtonForTab(tab)
    if (button && button.$forceUpdate) {
      button.$forceUpdate()
    }
  }
  // Activate a tab given a <b-tab> instance
  // Also accessed by <b-tab>
  activateTab(tab?:BTab) {
    let result = false
    if (tab) {
      const index = this.tabs.indexOf(tab)
      if (!tab.disabled && index > -1) {
        result = true
        this.currentTab = index
      }
    }
    if (!result) {
      // Couldn't set tab, so ensure v-model is set to `this.currentTab`
      /* istanbul ignore next: should rarely happen */
      this.$emit('input', this.currentTab)
    }
    return result
  }
  // Deactivate a tab given a <b-tab> instance
  // Accessed by <b-tab>
  deactivateTab(tab?:BTab) {
    if (tab) {
      // Find first non-disabled tab that isn't the one being deactivated
      // If no tabs are available, then don't deactivate current tab
      return this.activateTab(this.tabs.filter(t => t !== tab).find(notDisabled))
    } else {
      // No tab specified
      /* istanbul ignore next: should never happen */
      return false
    }
  }
  // Focus a tab button given it's <b-tab> instance
  focusButton(tab?:BTab) {
    // Wrap in `$nextTick()` to ensure DOM has completed rendering/updating before focusing
    this.$nextTick(() => {
      const button = this.getButtonForTab(tab)
      if (button && button.focus) {
        button.focus()
      }
    })
  }
  // Emit a click event on a specified <b-tab> component instance
  emitTabClick(tab:BTab, evt:Event) {
    if (evt && evt instanceof Event && tab && tab.$emit && !tab.disabled) {
      tab.$emit('click', evt)
    }
  }
  // Click handler
  clickTab(tab:BTab, evt:Event) {
    this.activateTab(tab)
    this.emitTabClick(tab, evt)
  }
  // Move to first non-disabled tab
  firstTab(focus:Event) {
    const tab = this.tabs.find(notDisabled)
    if (this.activateTab(tab) && focus) {
      this.focusButton(tab)
      this.emitTabClick(tab!, focus)
    }
  }
  // Move to previous non-disabled tab
  previousTab(focus?:Event) {
    const currentIndex = Math.max(this.currentTab, 0)
    const tab = this.tabs
      .slice(0, currentIndex)
      .reverse()
      .find(notDisabled)
    if (this.activateTab(tab) && focus) {
      this.focusButton(tab)
      this.emitTabClick(tab!, focus)
    }
  }
  // Move to next non-disabled tab
  nextTab(focus?:Event) {
    const currentIndex = Math.max(this.currentTab, -1)
    const tab = this.tabs.slice(currentIndex + 1).find(notDisabled)
    if (this.activateTab(tab) && focus) {
      this.focusButton(tab)
      this.emitTabClick(tab!, focus)
    }
  }
  // Move to last non-disabled tab
  lastTab(focus:Event) {
    const tab = this.tabs
      .slice()
      .reverse()
      .find(notDisabled)
    if (this.activateTab(tab) && focus) {
      this.focusButton(tab)
      this.emitTabClick(tab!, focus)
    }
  }

  render(h:CreateElement) {
    const tabs = this.tabs

    // Currently active tab
    let activeTab = tabs.find(tab => tab.localActive && !tab.disabled)

    // Tab button to allow focusing when no active tab found (keynav only)
    const fallbackTab = tabs.find(tab => !tab.disabled)

    // For each <b-tab> found create the tab buttons
    const buttons = tabs.map((tab, index) => {
      let tabIndex = null
      let button = (this as any) as BTabButtonHelper;
      // Ensure at least one tab button is focusable when keynav enabled (if possible)
      if (!this.noKeyNav) {
        // Buttons are not in tab index unless active, or a fallback tab
        tabIndex = -1
        if (activeTab === tab || (!activeTab && fallbackTab === tab)) {
          // Place tab button in tab sequence
          tabIndex = null
        }
      }
      return h(BTabButtonHelper, {
        key: tab._uid || index,
        ref: 'buttons',
        // Needed to make `this.$refs.buttons` an array
        refInFor: true,
        props: {
          tab: tab,
          tabs: tabs,
          id:
            tab.controlledBy ||
            (button.tab && button.tab.safeId ? button.tab.safeId(`_BV_tab_button_`) : null),
          controls: button.tab && button.tab.safeId ? button.tab.safeId() : null,
          tabIndex,
          setSize: tabs.length,
          posInSet: index + 1,
          noKeyNav: this.noKeyNav
        },
        on: {
          click: (evt:Event) => {
            this.clickTab(tab, evt)
          },
          first: this.firstTab,
          prev: this.previousTab,
          next: this.nextTab,
          last: this.lastTab
        }
      })
    })

    // Nav
    let nav = h(
      BNav,
      {
        ref: 'nav',
        class: this.localNavClass,
        attrs: {
          role: 'tablist',
          id: this.safeId('_BV_tab_controls_')
        },
        props: {
          fill: this.fill,
          justified: this.justified,
          align: this.align,
          tabs: !this.noNavStyle && !this.pills,
          pills: !this.noNavStyle && this.pills,
          vertical: this.vertical,
          small: this.small
        }
      },
      [buttons, this.normalizeSlot('tabs')]
    )
    nav = h(
      'div',
      {
        key: 'bv-tabs-nav',
        class: [
          {
            'card-header': this.card && !this.vertical && !(this.end || this.bottom),
            'card-footer': this.card && !this.vertical && (this.end || this.bottom),
            'col-auto': this.vertical
          },
          this.navWrapperClass
        ]
      },
      [nav]
    )

    let empty = h()
    if (!tabs || tabs.length === 0) {
      empty = h(
        'div',
        { key: 'bv-empty-tab', class: ['tab-pane', 'active', { 'card-body': this.card }] },
        this.normalizeSlot('empty')
      )
    }

    // Main content section
    const content = h(
      'div',
      {
        ref: 'tabsContainer',
        key: 'bv-tabs-container',
        staticClass: 'tab-content',
        class: [{ col: this.vertical }, this.contentClass],
        attrs: { id: this.safeId('_BV_tab_container_') }
      },
      concat(this.normalizeSlot('default'), empty)
    )

    // Render final output
    return h(
      this.tag,
      {
        staticClass: 'tabs',
        class: {
          row: this.vertical,
          'no-gutters': this.vertical && this.card
        },
        attrs: { id: this.safeId() }
      },
      [
        this.end || this.bottom ? content : h(),
        [nav],
        this.end || this.bottom ? h() : content
      ]
    )
  }
}