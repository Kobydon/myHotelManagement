import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoryComponent } from 'app/cutomer/category/category.component';
import { CustomerModule } from './customer.module';
import { ItemListCategoryComponent } from 'app/cutomer/item-list-category/item-list-category.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { MyOrdersComponent } from './my-orders/my-orders.component';
import { MyPaymentsComponent } from './my-payments/my-payments.component';
const routes: Routes = [
      { path: 'customer-category',      component: CategoryComponent },
      { path: 'customer-item-list/:id',           component: ItemListCategoryComponent },
       { path: 'checkout', component: CheckoutComponent }, 
              { path: 'my-orders', component: MyOrdersComponent },
                { path: 'my-payments', component: MyPaymentsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule { }
