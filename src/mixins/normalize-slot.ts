import { hasNormalizedSlot, normalizeSlot } from '../utils/normalize-slot'
import { concat } from '../utils/array'
import Component from 'vue-class-component';
import Vue from 'vue';
import { ScopedSlot } from 'vue/types/vnode';

@Component
export default class NormalizeSlotMixin extends Vue {
  _uid:string|number|undefined;
  hasNormalizedSlot(name:string) {
    // Returns true if the either a $scopedSlot or $slot exists with the specified name
    return hasNormalizedSlot(name, this.$scopedSlots, this.$slots)
  }
  normalizeSlot(name:string, scope?:ScopedSlot) {
    // Returns an array of rendered vNodes if slot found.
    // Returns undefined if not found.
    const vNodes = normalizeSlot(name, scope, this.$scopedSlots, this.$slots)
    return vNodes ? concat(vNodes) : vNodes
  }
}