import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlankLayoutComponent } from './blank-layout/blank-layout.component';
import { SignInComponent } from './sign-in/sign-in.component';
import {shareReplay } from 'rxjs/operators'
import { SignupComponent } from './signup/signup.component';

const routes: Routes = [


  {
    path: 'account',
    component: BlankLayoutComponent,
    children: [
      
      {
        path: 'signin',
        component: SignInComponent,
    },
      
    {
      path: 'signup',
      component: SignupComponent,
  },
  ]
}

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoginRoutingModule { }
