import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PosLayoutRoute} from './pos.routing';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BlockUI } from 'ng-block-ui';
import { LoadingTemplate } from 'app/loading-template';

import { BlockUIModule } from 'ng-block-ui';
import { ItemListComponent } from 'app/item-list/item-list.component';
import { CheckoutComponent } from 'app/checkout/checkout.component';
import { CategoryComponent } from 'app/category/category.component';
import { PosLayoutComponent } from 'app/pos-layout/pos-layout.component';
import { ItemListCategoryComponent } from 'app/item-list-category/item-list-category.component';
import { ItemListVipComponent } from 'app/item-list-vip/item-list-vip.component';

@NgModule({
  declarations: [ItemListComponent,CheckoutComponent,CategoryComponent,ItemListCategoryComponent,ItemListVipComponent],
  imports: [
    CommonModule,
     RouterModule.forChild(PosLayoutRoute),
        HttpClientModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NgbModule,
   
        BlockUIModule.forRoot({
           
             template: LoadingTemplate ,
             // delayStart: 50,
             // delayStop: 300
           }),
    
  ],
  exports: [
 
    ItemListComponent,
    CheckoutComponent,
    CategoryComponent,
    ItemListCategoryComponent,
    ItemListVipComponent,
   
  ]
})
export class PosModule { }
