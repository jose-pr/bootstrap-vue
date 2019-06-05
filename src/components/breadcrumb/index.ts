//
// Breadcrumb
//
import Vue from 'vue'
import { BvPlugin, BvComponent } from '../../'
import BBreadcrumb from './breadcrumb'
import BBreadcrumbItem from './breadcrumb-item'
import BBreadcrumbLink from './breadcrumb-link'
import { installFactory } from '../../utils/plugins'

// Component: b-breadcrumb
const components = {
    BBreadcrumb,
    BBreadcrumbItem,
    BBreadcrumbLink
}

// Plugin
export const BreadcrumbPlugin: BvPlugin = {
    install: installFactory({ components })
}
export default BreadcrumbPlugin



export { BBreadcrumb, BBreadcrumbItem, BBreadcrumbLink }
