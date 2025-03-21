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

export const AppRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  }, {
    path: '',canActivate:[AuthGuard],
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
    path: '',canActivate:[AuthGuard],
    component: ResLayoutComponent,
    children: [
        {
      path: '',
      loadChildren: () => import('../app/restaurant/restaurant.module').then(x => x.RestaurantModule)
  }]},


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
    component: PosLayoutComponent,
    children: [
        {
      path: '',
      loadChildren: () => import('../app/pos/pos.module').then(x => x.PosModule)
  },

  { path: 'item-list',      component: ItemListComponent },
  { path: 'item-category-list/:id', component: ItemListCategoryComponent },


]},



]