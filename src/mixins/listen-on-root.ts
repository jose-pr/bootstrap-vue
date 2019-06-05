import Component from "vue-class-component";
import Vue from "vue";

/**
 * Issue #569: collapse::toggle::state triggered too many times
 * @link https://github.com/bootstrap-vue/bootstrap-vue/issues/569
 */

// @vue/component
@Component({})
export default class ListenOnRootMixin extends Vue{
  /**
     * Safely register event listeners on the root Vue node.
     * While Vue automatically removes listeners for individual components,
     * when a component registers a listener on root and is destroyed,
     * this orphans a callback because the node is gone,
     * but the root does not clear the callback.
     *
     * When registering a $root listener, it also registers a listener on
     * the component's `beforeDestroy` hook to automatically remove the
     * event listener from the $root instance.
     *
     * @param {string} event
     * @param {function} callback
     * @chainable
     */
    listenOnRoot(event:string|string[], callback:Function) {
      this.$root.$on(event, callback)
      this.$on('hook:beforeDestroy', () => {
        this.$root.$off(event, callback)
      })
      // Return this for easy chaining
      return this
    }

    /**
     * Safely register a $once event listener on the root Vue node.
     * While Vue automatically removes listeners for individual components,
     * when a component registers a listener on root and is destroyed,
     * this orphans a callback because the node is gone,
     * but the root does not clear the callback.
     *
     * When registering a $root listener, it also registers a listener on
     * the component's `beforeDestroy` hook to automatically remove the
     * event listener from the $root instance.
     *
     * @param {string} event
     * @param {function} callback
     * @chainable
     */
    listenOnRootOnce(event:string|string[], callback:Function) {
      this.$root.$once(event, callback)
      this.$on('hook:beforeDestroy', () => {
        this.$root.$off(event, callback)
      })
      // Return this for easy chaining
      return this
    }

    /**
     * Convenience method for calling vm.$emit on vm.$root.
     * @param {string} event
     * @param {*} args
     * @chainable
     */
    emitOnRoot(event:string, ...args:any[]) {
      this.$root.$emit(event, ...args)
      // Return this for easy chaining
      return this
    }
}