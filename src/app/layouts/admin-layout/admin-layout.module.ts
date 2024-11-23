import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AdminLayoutRoutes } from './admin-layout.routing';

import { DashboardComponent }       from '../../pages/dashboard/dashboard.component';
import { UserComponent }            from '../../pages/user/user.component';
import { TableComponent }           from '../../pages/table/table.component';
import { TypographyComponent }      from '../../pages/typography/typography.component';
import { IconsComponent }           from '../../pages/icons/icons.component';
import { MapsComponent }            from '../../pages/maps/maps.component';
import { NotificationsComponent }   from '../../pages/notifications/notifications.component';
import { UpgradeComponent }         from '../../pages/upgrade/upgrade.component';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';
import { AllUsersComponent } from 'app/pages/all-users/all-users.component';
import { BrowserModule } from '@angular/platform-browser';
import { BlockUIModule } from 'ng-block-ui';
import { LoadingTemplate } from 'app/loading-template';
import { RoomTypesComponent } from 'app/pages/room-types/room-types.component';
import { AllRoomsComponent } from 'app/pages/all-rooms/all-rooms.component';
import { RoomStatusComponent } from 'app/room-status/room-status.component';
import { GuestComponent } from 'app/pages/guest/guest.component';
import { routeAnimations } from 'app/shared/animation';
import { BookingsComponent } from 'app/pages/bookings/bookings.component';
import { PaymentComponent } from 'app/pages/payment/payment.component';
import { EmployeeService } from 'app/services/employee.service';
import { EmployeesComponent } from 'app/pages/employees/employees.component';
import { AttendanceComponent } from 'app/pages/attendance/attendance.component';
import { AllReservationsComponent } from 'app/all-reservations/all-reservations.component';
import { TodoListComponent } from 'app/todo-list/todo-list.component';
import { HouseKeepingComponent } from 'app/house-keeping/house-keeping.component';
import { RefundComponent } from 'app/refund/refund.component';
import { DetailedReportComponent } from 'app/detailed-report/detailed-report.component';
import { PurchaseRequestComponent } from 'app/purchase-request/purchase-request.component';
import { AddPurchaseRequestComponent } from 'app/add-purchase-request/add-purchase-request.component';
import { ExpensesComponent } from 'app/expenses/expenses.component';


    

@NgModule({
  imports: [
    
    RouterModule.forChild(AdminLayoutRoutes),
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
  declarations: [
    GuestComponent,
    DashboardComponent,
    UserComponent,
    TableComponent,
    UpgradeComponent,
    TypographyComponent,
    IconsComponent,
    MapsComponent,
    NotificationsComponent,
    UserComponent,
    AllUsersComponent,
    RoomTypesComponent,
    AllRoomsComponent,
    RoomStatusComponent,
    ExpensesComponent,
 
    BookingsComponent,
    PaymentComponent,

    EmployeesComponent,
    AttendanceComponent,
    AllReservationsComponent,
    TodoListComponent,
    HouseKeepingComponent,
    RefundComponent,
    DetailedReportComponent,
    PurchaseRequestComponent,
    AddPurchaseRequestComponent



  ]
})

export class AdminLayoutModule {}