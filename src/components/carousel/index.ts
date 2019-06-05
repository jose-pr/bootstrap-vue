import BCarousel from './carousel'
import BCarouselSlide from './carousel-slide'
import { installFactory } from '../../utils/plugins'
import { BvPlugin } from '../..';

const components = {
  BCarousel,
  BCarouselSlide
}

export { BCarousel, BCarouselSlide }

export const CarouselPlugin:BvPlugin={
  install: installFactory({ components })
}
export default CarouselPlugin;