import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerRoutingModule } from './customer-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CategoryComponent } from 'app/cutomer/category/category.component';
import { ItemListCategoryComponent } from 'app/cutomer/item-list-category/item-list-category.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { MyOrdersComponent } from './my-orders/my-orders.component';
import { MyPaymentsComponent } from './my-payments/my-payments.component';


@NgModule({
  declarations: [CategoryComponent,ItemListCategoryComponent, CheckoutComponent, MyOrdersComponent, MyPaymentsComponent],

  imports: [
    CommonModule,
    CustomerRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule,
    NgbModule
  ]
})
export class CustomerModule { }
