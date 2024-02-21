import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ResLayoutComponent } from 'app/res-layout/res-layout.component';

const routes: Routes = [

    
  { path: 'pos',      component: ResLayoutComponent ,
  children: [

       
  // { path: 'features',      component: ListComponent },
 ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RestaurantRoutingModule { }
