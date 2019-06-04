import { hasNormalizedSlot, normalizeSlot } from '../utils/normalize-slot'
import { concat } from '../utils/array'
import Component from 'vue-class-component';
import Vue from 'vue';

@Component
export default class MyMixin extends Vue {
  mixinValue:string = 'Hello';
  _uid:string|number|undefined;
  hasNormalizedSlot(name:string) {
    // Returns true if the either a $scopedSlot or $slot exists with the specified name
    return hasNormalizedSlot(name, this.$scopedSlots, this.$slots)
  }
  normalizeSlot(name:string, scope = {}) {
    // Returns an array of rendered vNodes if slot found.
    // Returns undefined if not found.
    const vNodes = normalizeSlot(name, scope as any, this.$scopedSlots, this.$slots)
    return vNodes ? concat(vNodes) : vNodes
  }
}