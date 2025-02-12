import BCard from './card'
import BCardHeader from './card-header'
import BCardBody from './card-body'
import BCardTitle from './card-title'
import BCardSubTitle from './card-sub-title'
import BCardFooter from './card-footer'
import BCardImg from './card-img'
import BCardImgLazy from './card-img-lazy'
import BCardText from './card-text'
import BCardGroup from './card-group'
import { installFactory } from '../../utils/plugins'
import { BvPlugin } from '../..';

const components = {
  BCard,
  BCardHeader,
  BCardBody,
  BCardTitle,
  BCardSubTitle,
  BCardFooter,
  BCardImg,
  BCardImgLazy,
  BCardText,
  BCardGroup
}

export {
  BCard,
  BCardHeader,
  BCardBody,
  BCardTitle,
  BCardSubTitle,
  BCardFooter,
  BCardImg,
  BCardImgLazy,
  BCardText,
  BCardGroup
} 

export  const CardPlugin: BvPlugin ={
  install: installFactory({ components })
}
export default CardPlugin