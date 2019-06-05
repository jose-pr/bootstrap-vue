import Vue from '../../utils/vue'
import BImg from '../image/img'
import idMixin from '../../mixins/id'
import normalizeSlotMixin from '../../mixins/normalize-slot'
import { hasTouchSupport } from '../../utils/env'
import { htmlOrText } from '../../utils/html'
import { BvComponent } from '../..';
import Component, { mixins } from 'vue-class-component';
import { Prop, Inject } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import { BCarousel } from './carousel';

/* export const props = {
  imgSrc: {
    type: String
    // default: undefined
  },
  imgAlt: {
    type: String
    // default: undefined
  },
  imgWidth: {
    type: [Number, String]
    // default: undefined
  },
  imgHeight: {
    type: [Number, String]
    // default: undefined
  },
  imgBlank: {
    type: Boolean,
    default: false
  },
  imgBlankColor: {
    type: String,
    default: 'transparent'
  },
  contentVisibleUp: {
    type: String
  },
  contentTag: {
    type: String,
    default: 'div'
  },
  caption: {
    type: String
  },
  captionHtml: {
    type: String
  },
  captionTag: {
    type: String,
    default: 'h3'
  },
  text: {
    type: String
  },
  textHtml: {
    type: String
  },
  textTag: {
    type: String,
    default: 'p'
  },
  background: {
    type: String
  } 
}*/

// @vue/component
@Component({})
export default class BCarouselSlide extends mixins(idMixin,normalizeSlotMixin){
  
  @Prop() imgSrc!:string
  @Prop() imgAlt!:string
  @Prop() imgWidth!:number|string
  @Prop() imgHeight!:number|string
  @Prop({default:false}) imgBlank!:boolean
  @Prop({default:'transparent'}) imgBlankColor!:string
  @Prop() contentVisibleUp!:string
  @Prop({default:'div'}) contentTag!:string
  @Prop() caption!:string
  @Prop() background!:string;
  @Prop({default:'p'}) textTag!:string;
  @Prop() textHtml!:string;
  @Prop() text!:string;
  @Prop({default:'h3'}) captionTag!:string;
  @Prop() captionHtml!:string;

  get contentClasses() {
    return [
      this.contentVisibleUp ? 'd-none' : '',
      this.contentVisibleUp ? `d-${this.contentVisibleUp}-block` : ''
    ]
  }
  get computedWidth() {
    // Use local width, or try parent width
    return this.imgWidth || this.bvCarousel.imgWidth || null
  }
  get computedHeight() {
    // Use local height, or try parent height
    return this.imgHeight || this.bvCarousel.imgHeight || null
  }
  @Inject({default() {
    return {
      // Explicitly disable touch if not a child of carousel
      noTouch: true
    }}}) bvCarousel!:BCarousel

  render(h:CreateElement) {
    const noDrag = !this.bvCarousel.noTouch && hasTouchSupport

    let img:any = this.normalizeSlot('img') as any;
    if (!img && (this.imgSrc || this.imgBlank)) {
      img = h(BImg, {
        props: {
          fluidGrow: true,
          block: true,
          src: this.imgSrc,
          blank: this.imgBlank,
          blankColor: this.imgBlankColor,
          width: this.computedWidth,
          height: this.computedHeight,
          alt: this.imgAlt
        },
        // Touch support event handler
        on: noDrag
          ? {
              dragstart: (e:Event) => {
                /* istanbul ignore next: difficult to test in JSDOM */
                e.preventDefault()
              }
            }
          : {}
      })
    }
    if (!img) {
      img = h()
    }

    const content = h(
      this.contentTag,
      { staticClass: 'carousel-caption', class: this.contentClasses },
      [
        this.caption || this.captionHtml
          ? h(this.captionTag, {
              domProps: htmlOrText(this.captionHtml, this.caption)
            })
          : h(),
        this.text || this.textHtml
          ? h(this.textTag, { domProps: htmlOrText(this.textHtml, this.text) })
          : h(),
        this.normalizeSlot('default')
      ]
    )

    return h(
      'div',
      {
        staticClass: 'carousel-item',
        style: { background: this.background || this.bvCarousel.background || null },
        attrs: { id: this.safeId(), role: 'listitem' }
      },
      [img, content]
    )
  }

}