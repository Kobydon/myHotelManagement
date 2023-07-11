import { Routes } from '@angular/router';

import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { BlankLayoutComponent } from './login/blank-layout/blank-layout.component';
import { SignInComponent } from './login/sign-in/sign-in.component';
import { AuthGuard } from './auth.guard';
import { LayoutComponent } from './features/layout/layout.component';

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
      loadChildren: () => import('../../../HMS/src/app/login/login.module').then(x => x.LoginModule)
  }]},




  {
    path: '',canActivate:[AuthGuard],
    component: LayoutComponent,
    children: [
        {
      path: '',
      loadChildren: () => import('../../../HMS/src/app/features/features.module').then(x => x.FeaturesModule)
  }]}
]