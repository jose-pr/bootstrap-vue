import { isFunction } from './inspect'
import { Dict } from '..';
import { NormalizedScopedSlot, VNode, ScopedSlot } from 'vue/types/vnode';

// Note for functional components:
// In functional components, `slots` is a function so it must be called
// first before passing to the below methods. `scopedSlots` is always an
// object and may be undefined (for Vue < 2.6.x)

/**
 * Returns true if either scoped or unscoped named slot eists
 *
 * @param {String} name
 * @param {Object} scopedSlots
 * @param {Object} slots
 * @returns {Array|undefined} vNodes
 */
const hasNormalizedSlot = (name:string, $scopedSlots:Dict<NormalizedScopedSlot|undefined> = {}, $slots:Dict<VNode[]|undefined> = {}) => {
  // Returns true if the either a $scopedSlot or $slot exists with the specified name
  return Boolean($scopedSlots[name] || $slots[name])
}

/**
 * Returns vNodes for named slot either scoped or unscoped
 *
 * @param {String} name
 * @param {String} scope
 * @param {Object} scopedSlots
 * @param {Object} slots
 * @returns {Array|undefined} vNodes
 */
const normalizeSlot = (name:string, scope:ScopedSlot|undefined = undefined, $scopedSlots:Dict<NormalizedScopedSlot|undefined> = {}, $slots:Dict<VNode[]|undefined> = {}) => {
  // Note: in Vue 2.6.x, all names slots are also scoped slots
  const slot = $scopedSlots[name] || $slots[name]
  return isFunction(slot) ? (slot as ScopedSlot)(scope) : slot
}

// Named exports
export { hasNormalizedSlot, normalizeSlot }

// Default export (backwards compatability)
export default normalizeSlot
