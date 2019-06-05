import { PropsDef } from '..'

interface CardMixin {
  tag: string
  bgVariant: string
  borderVariant: string
  textVariant: string
}

const CardMixinProps: PropsDef<CardMixin> = {
  tag: {
    type: String,
    default: 'div'
  },
  bgVariant: {
    type: String,
    default: null
  },
  borderVariant: {
    type: String,
    default: null
  },
  textVariant: {
    type: String,
    default: null
  }
}

// @vue/component
export default {
  props: CardMixinProps
}
export{
  CardMixin
}
