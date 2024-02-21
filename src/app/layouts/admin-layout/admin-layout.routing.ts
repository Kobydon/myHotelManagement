import { Routes } from '@angular/router';

import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { UserComponent } from '../../pages/user/user.component';
import { TableComponent } from '../../pages/table/table.component';
import { TypographyComponent } from '../../pages/typography/typography.component';
import { IconsComponent } from '../../pages/icons/icons.component';
import { MapsComponent } from '../../pages/maps/maps.component';
import { NotificationsComponent } from '../../pages/notifications/notifications.component';
import { UpgradeComponent } from '../../pages/upgrade/upgrade.component';
import { OrderComponent } from 'app/pages/order/order.component';
import { AllUsersComponent } from 'app/pages/all-users/all-users.component';
import { RoomTypesComponent } from 'app/pages/room-types/room-types.component';
import { Component } from '@angular/core';
import { AllRoomsComponent } from 'app/pages/all-rooms/all-rooms.component';
import { RoomStatusComponent } from 'app/room-status/room-status.component';
import { GuestComponent } from 'app/pages/guest/guest.component';
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
import { CalenderComponent } from 'app/calender/calender.component';
import { PurchaseRequestComponent } from 'app/purchase-request/purchase-request.component';



export const AdminLayoutRoutes: Routes = [
    { path: 'dashboard',      component: DashboardComponent },
    { path: 'user',           component: UserComponent },
    { path: 'table',          component: TableComponent },
    { path: 'typography',     component: TypographyComponent },
    { path: 'icons',          component: IconsComponent },
    { path: 'maps',           component: MapsComponent },
    { path: 'notifications',  component: NotificationsComponent },
    { path: 'upgrade',        component: UpgradeComponent },
    { path: 'purchase-request',        component: PurchaseRequestComponent },
    { path: 'order',        component: OrderComponent },
    { path: 'calender',        component: CalenderComponent },
    {path:'all-users',component:AllUsersComponent},
    { path: 'room-types',        component: RoomTypesComponent },
    {path:'all-rooms' ,component:AllRoomsComponent   },
    {path:'room-status' ,component:RoomStatusComponent   },
    {path:'all-guest' ,component:GuestComponent   },
    {path:'all-bookings' ,component:BookingsComponent   },
    {path:'payment' ,component:PaymentComponent   },
    {path:'employees' ,component:EmployeesComponent   },
    {path:'attendance' ,component:AttendanceComponent   },
    {path:'all-reservations' ,component:AllReservationsComponent   },
    {path:'todo-list' ,component:TodoListComponent   },
    {path:'house-keeping',component:HouseKeepingComponent},
    {path:'refund-list',component:RefundComponent},
    {path:'detailed-report',component:DetailedReportComponent}


]
