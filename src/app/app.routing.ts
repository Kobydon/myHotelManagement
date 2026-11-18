import { Routes } from '@angular/router';

import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { BlankLayoutComponent } from './login/blank-layout/blank-layout.component';
import { SignInComponent } from './login/sign-in/sign-in.component';
import { AuthGuard } from './auth.guard';
import { LayoutComponent } from './features/layout/layout.component';
import { ResLayoutComponent } from './res-layout/res-layout.component';
import { SignupComponent } from './login/signup/signup.component';
import { PosLayoutComponent } from './pos-layout/pos-layout.component';
import { ItemListComponent } from './item-list/item-list.component';
import { ItemListCategoryComponent } from './item-list-category/item-list-category.component';
import { ViewOrderComponent } from './view-order/view-order.component';
import { ViewDrinkOrderComponent } from './view-drink-order/view-drink-order.component';
import { ItemListVipComponent } from './item-list-vip/item-list-vip.component';
import { CheckTodaysOrdersComponent } from './check-todays-orders/check-todays-orders.component';
import { CheckDrinkOrdersComponent } from './check-drink-orders/check-drink-orders.component';
import { ViewLabelOrderComponent } from './view-label-order/view-label-order.component';
import { ViewDtfOrderComponent } from './view-dtf-order/view-dtf-order.component';
import { GiversTabComponent } from './givers-tab/givers-tab.component';
import { CustomerLayoutComponent } from './customer-layout/customer-layout.component';
import{RoleGuard} from './role.guard';
import { Role } from './roles';
import { ViewUvDtfComponent } from './view-uv-dtf/view-uv-dtf.component';
import { TrackOrderComponent } from './track-order/track-order.component';

export const AppRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {path:'view-order',component:ViewOrderComponent,canActivate:[RoleGuard],data:{roles:[Role.DigitalPrinting]}},
    {path:'view-uvdtf-order',component:ViewUvDtfComponent,canActivate:[RoleGuard],data:{roles:[Role.uvdtf]}},
   {path:'view-all-order',component:GiversTabComponent,canActivate:[RoleGuard],data:{roles:[Role.Giver]}},

   {path:'view-dtf-order',component:ViewDtfOrderComponent,canActivate:[RoleGuard],data:{roles:[Role.Dtf]}},
  {path:'view-large-format-order',component:ViewDrinkOrderComponent,canActivate:[RoleGuard],data:{roles:[Role.Bartender]}},
    {path:'view-label-order',component:ViewLabelOrderComponent,canActivate:[RoleGuard],data:{roles:[Role.Label]}},
  {
    path: '',canActivate:[AuthGuard,RoleGuard],data:{roles:[Role.Admin]},
    component: AdminLayoutComponent,
    children: [
        {
      path: '',
      loadChildren: () => import('./layouts/admin-layout/admin-layout.module').then(x => x.AdminLayoutModule)
  }]},
  

  {
    path: '',
    component: BlankLayoutComponent,
    children: [
        {
      path: '',
      loadChildren: () => import('../../src/app/login/login.module').then(x => x.LoginModule)
  }]},
  {
  path: 'track-order',
  component: TrackOrderComponent
},


  {
    path: '',canActivate:[AuthGuard],
    component: ResLayoutComponent,
    children: [
        {
      path: '',
      loadChildren: () => import('../app/restaurant/restaurant.module').then(x => x.RestaurantModule)
  }]},



  {

    path:'todays-order',
    component:CheckTodaysOrdersComponent
  },


  {

    path:'todays-order-drink',
    component:CheckDrinkOrdersComponent
  },
  {
    path: '',canActivate:[AuthGuard],
    component: LayoutComponent,
    children: [
        {
      path: '',
      loadChildren: () => import('../app/features/features.module').then(x => x.FeaturesModule)
  }]},


    
  {
    path: '',canActivate:[AuthGuard],
    component: CustomerLayoutComponent,
    children: [
        {
      path: '',
      loadChildren: () => import('../app/customer/customer.module').then(x => x.CustomerModule)
        }]
  },

  
  {
    path: '',canActivate:[AuthGuard],
    component: PosLayoutComponent,
    children: [
        {
      path: '',
      loadChildren: () => import('../app/pos/pos.module').then(x => x.PosModule)
  },

  { path: 'item-list',      component: ItemListComponent,canActivate:[RoleGuard],data:{roles:[Role.Waiter]}},
  { path: 'item-category-list/:id', component: ItemListCategoryComponent,canActivate:[RoleGuard],data:{roles:[Role.Waiter]}},
  { path: 'item-category-list-vip/:id', component: ItemListVipComponent,canActivate:[RoleGuard],data:{roles:[Role.Waiter]}},


]},



]