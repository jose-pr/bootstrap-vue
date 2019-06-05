import toString from './to-string'
import { isArray, isNull, isPlainObject, isString, isUndefined } from './inspect'
import { keys } from './object'
import { Dict } from '..';
import Vue from './vue'


const ANCHOR_TAG = 'a'

// Precompile RegExp
const commaRE = /%2C/g
const encodeReserveRE = /[!'()*]/g
// Method to replace reserved chars
const encodeReserveReplacer = (c:string) => '%' + c.charCodeAt(0).toString(16)

// Fixed encodeURIComponent which is more conformant to RFC3986:
// - escapes [!'()*]
// - preserve commas
const encode = (str:any) =>
  encodeURIComponent(toString(str))
    .replace(encodeReserveRE, encodeReserveReplacer)
    .replace(commaRE, ',')

const decode = decodeURIComponent

// Stringifies an object of query parameters
// See: https://github.com/vuejs/vue-router/blob/dev/src/util/query.js
export const stringifyQueryObj = (obj:any) => {
  if (!isPlainObject(obj)) {
    return ''
  }

  const query = keys(obj)
    .map(key => {
      const val = obj[key]
      if (isUndefined(val)) {
        return ''
      } else if (isNull(val)) {
        return encode(key)
      } else if (isArray(val)) {
        return val
          .reduce((results, val2) => {
            if (isNull(val2)) {
              results.push(encode(key))
            } else if (!isUndefined(val2)) {
              // Faster than string interpolation
              results.push(encode(key) + '=' + encode(val2))
            }
            return results
          }, [])
          .join('&')
      }
      // Faster than string interpolation
      return encode(key) + '=' + encode(val)
    })
    /* must check for length, as we only want to filter empty strings, not things that look falsey! */
    .filter(x => x.length > 0)
    .join('&')

  return query ? `?${query}` : ''
}

export const parseQuery = (query:any) => {
  const parsed:Dict<string|null|(string|null)[]> = {}
  query = toString(query)
    .trim()
    .replace(/^(\?|#|&)/, '')

  if (!query) {
    return parsed
  }

  (query as string).split('&').forEach(param => {
    const parts = param.replace(/\+/g, ' ').split('=')
    const key = decode(parts.shift()!)
    const val = parts.length > 0 ? decode(parts.join('=')) : null

    if (isUndefined(parsed[key])) {
      parsed[key] = val
    } else if (isArray(parsed[key])) {
      (parsed[key] as (string|null)[]).push(val)
    } else {
      (parsed[key] as (string|null)[])= [parsed[key] as string, val]
    }
  })

  return parsed
}

export const isRouterLink = (tag:string) => tag !== ANCHOR_TAG
interface routerPathObj {
    path?:string,
    query?:string,
    hash?:string
}
type routerPath = routerPathObj | string;
export const computeTag = ({ to, disabled }:{to?:routerPath,disabled?:boolean} = {}, thisOrParent:any) => {
  return thisOrParent.$router && to && !disabled
    ? thisOrParent.$nuxt
      ? 'nuxt-link'
      : 'router-link'
    : ANCHOR_TAG
}

export const computeRel = ({ target, rel }:{target?:string,rel?:string} = {}) => {
  if (target === '_blank' && isNull(rel)) {
    return 'noopener'
  }
  return rel || null
}

export const computeHref = (
  { href, to }:{href?:string,to?:routerPath} = {},
  tag = ANCHOR_TAG,
  fallback = '#',
  toFallback = '/'
):string|null => {
  // We've already checked the $router in computeTag(), so isRouterLink() indicates a live router.
  // When deferring to Vue Router's router-link, don't use the href attribute at all.
  // We return null, and then remove href from the attributes passed to router-link
  if (isRouterLink(tag)) {
    return null
  }

  // Return `href` when explicitly provided
  if (href) {
    return href
  }

  // Reconstruct `href` when `to` used, but no router
  if (to) {
    // Fallback to `to` prop (if `to` is a string)
    if (isString(to)) {
      return to as string || toFallback
    }
    // Fallback to `to.path + to.query + to.hash` prop (if `to` is an object)
    let _to = to as routerPathObj;
    if (isPlainObject(to) && (_to.path || _to.query || _to.hash)) {
      const path = toString(_to.path)
      const query = stringifyQueryObj(_to.query)
      let hash = toString(_to.hash)
      hash = !hash || hash.charAt(0) === '#' ? hash : `#${hash}`
      return `${path}${query}${hash}` || toFallback
    }
  }

  // If nothing is provided return the fallback
  return fallback
}
