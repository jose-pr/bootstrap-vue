import identity from './identity'
import { isArray } from './inspect'
import { keys } from './object'
import { Dict } from '..';
import { PropOptions } from 'vue';

/**
 * Given an array of properties or an object of property keys,
 * plucks all the values off the target object, returning a new object
 * that has props that reference the original prop values
 *
 * @param {{}|string[]} keysToPluck
 * @param {{}} objToPluck
 * @param {Function} transformFn
 * @return {{}}
 */
const pluckProps = <T extends {}>(keysToPluck:Dict<any>|string[], objToPluck:Dict<T>, transformFn:(id:string)=>string = identity):Dict<T> => {
  return (isArray(keysToPluck) ? keysToPluck.slice() : keys(keysToPluck)).reduce<Dict<any>>((memo, prop) => {
    memo[transformFn(prop)] = objToPluck[prop]
    return memo
  }, {})
}

export default pluckProps
