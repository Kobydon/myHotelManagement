import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SearchPropertyComponent } from 'app/search-property/search-property.component';

const routes: Routes = [


  { path: 'search-property/:id', component: SearchPropertyComponent }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SearchRoutingModule { }
