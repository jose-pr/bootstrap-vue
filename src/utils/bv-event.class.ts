import { assign, defineProperty, defineProperties, readonlyDescriptor } from './object'

interface BvEventInit {
  type:string;
  cancelable:boolean;
  nativeEvent:boolean;
  target:Element|null;
  relatedTarget:Element|null;
  vueTarget:any;
  componentId:string;
}

class BvEvent<T=never> {
  
  type!:string;
  cancelable!:boolean;
  nativeEvent!:boolean;
  target!:Element|null;
  relatedTarget!:Element|null;
  vueTarget!:any;
  componentId!:string;

  preventDefault!:()=>void;

  constructor(type:string, eventInit:Partial<BvEventInit&T> = {}) {
    // Start by emulating native Event constructor.
    if (!type) {
      /* istanbul ignore next */
      throw new TypeError(
        `Failed to construct '${this.constructor.name}'. 1 argument required, ${
          arguments.length
        } given.`
      )
    }
    // Assign defaults first, the eventInit,
    // and the type last so it can't be overwritten.
    assign(this, BvEvent.Defaults, (this.constructor as any).Defaults, eventInit, { type })
    // Freeze some props as readonly, but leave them enumerable.
    defineProperties(this, {
      type: readonlyDescriptor(),
      cancelable: readonlyDescriptor(),
      nativeEvent: readonlyDescriptor(),
      target: readonlyDescriptor(),
      relatedTarget: readonlyDescriptor(),
      vueTarget: readonlyDescriptor(),
      componentId: readonlyDescriptor()
    })
    // Create a private variable using closure scoping.
    let defaultPrevented = false
    // Recreate preventDefault method. One way setter.
    this.preventDefault = function preventDefault() {
      if (this.cancelable) {
        defaultPrevented = true
      }
    }
    // Create 'defaultPrevented' publicly accessible prop
    // that can only be altered by the preventDefault method.
    defineProperty(this, 'defaultPrevented', {
      enumerable: true,
      get() {
        return defaultPrevented
      }
    })
  }

  static get Defaults() {
    return {
      type: '',
      cancelable: true,
      nativeEvent: null,
      target: null,
      relatedTarget: null,
      vueTarget: null,
      componentId: null
    }
  }
}

// Named Exports
export { BvEvent }

// Default Export
export default BvEvent
