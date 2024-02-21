import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastrModule } from "ngx-toastr";

import { SidebarModule } from './sidebar/sidebar.module';
import { FooterModule } from './shared/footer/footer.module';
import { NavbarModule} from './shared/navbar/navbar.module';
import { FixedPluginModule} from './shared/fixedplugin/fixedplugin.module';

import { AppComponent } from './app.component';
import { AppRoutes } from './app.routing';

import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { LoginModule } from "./login/login.module";
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { userService } from "./user.service";
import { AuthInterceptor } from "./auth.interceptor";
import { BrowserModule } from "@angular/platform-browser";
import { CommonModule } from "@angular/common";
import { BlockUIModule } from 'ng-block-ui';
import { RoomTypesComponent } from './pages/room-types/room-types.component';
import { AllRoomsComponent } from './pages/all-rooms/all-rooms.component';
import { RoomStatusComponent } from './room-status/room-status.component';
import { GuestComponent } from './pages/guest/guest.component';
import { BookingsComponent } from './pages/bookings/bookings.component';
import { PaymentComponent } from './pages/payment/payment.component';
import { EmployeesComponent } from './pages/employees/employees.component';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { FeaturesModule } from "./features/features.module";
import { AllReservationsComponent } from './all-reservations/all-reservations.component';
import { TodoListComponent } from './todo-list/todo-list.component';
import { HouseKeepingComponent } from './house-keeping/house-keeping.component';
import { RefundComponent } from './refund/refund.component';
import { DetailedReportComponent } from './detailed-report/detailed-report.component';
import { ResLayoutComponent } from './res-layout/res-layout.component';
import { RestaurantModule } from "./restaurant/restaurant.module";
import { CalenderComponent } from './calender/calender.component';
import { PurchaseRequestComponent } from './purchase-request/purchase-request.component';
// import { AllReservationsComponent } from './admin/all-reservations/all-reservations.component';



@NgModule({
  declarations: [
    AppComponent,
    AdminLayoutComponent,
    ResLayoutComponent,






  
   

 



    // RoomTypesComponent,
    
  ],
  imports: [
    BrowserModule,
  
    BrowserAnimationsModule,
    FeaturesModule,
  
    LoginModule,
    HttpClientModule,
    RestaurantModule,
    
    RouterModule.forRoot(AppRoutes,{
      // useHash: true
    }),
    SidebarModule,
    NavbarModule,
    ToastrModule.forRoot({
      // timeOut: 10000,
      // positionClass: 'toast-bottom-right',
      // preventDuplicates: true,
  
      }),
    FooterModule,
    FixedPluginModule
  ],
  providers: [
    userService,
 

  
      
   {
     
     provide: HTTP_INTERCEPTORS,
     useClass: AuthInterceptor,
     multi: true
   }
 ],
  bootstrap: [AppComponent]
})
export class AppModule { }