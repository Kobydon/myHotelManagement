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
import { AddPurchaseRequestComponent } from 'app/add-purchase-request/add-purchase-request.component';
import { ExpensesComponent } from 'app/expenses/expenses.component';
import { BudgetComponent } from 'app/budget/budget.component';
import { IncomeComponent } from 'app/income/income.component';
import { BudgetReportComponent } from 'app/budget-report/budget-report.component';
import { DailyIncomeReportComponent } from 'app/daily-income-report/daily-income-report.component';
import { DailyIncomeReportDatesBetweenComponent } from 'app/daily-income-report-dates-between/daily-income-report-dates-between.component';
import { ItemComponent } from 'app/item/item.component';
import { ItemGroupComponent } from 'app/item-group/item-group.component';
import { ItemFamilyComponent } from 'app/item-family/item-family.component';
import { ItemCategoryComponent } from 'app/item-category/item-category.component';
import { StoreComponent } from 'app/store/store.component';
import { StockComponent } from 'app/stock/stock.component';
import { DepartmentsComponent } from 'app/departments/departments.component';
import { TransferStockComponent } from 'app/transfer-stock/transfer-stock.component';
import { VendorComponent } from 'app/vendor/vendor.component';
import { PurchaseOrderComponent } from 'app/purchase-order/purchase-order.component';
import { ReceivedItemsComponent } from 'app/received-items/received-items.component';
import { ReturnRequestComponent } from 'app/return-request/return-request.component';
import { GeneralLedgerComponent } from 'app/general-ledger/general-ledger.component';
import { AccountReceivableComponent } from 'app/account-receivable/account-receivable.component';
import { LedgerPagesComponent } from 'app/ledger-pages/ledger-pages.component';
import { AccountReceivablePagesComponent } from 'app/account-receivable-pages/account-receivable-pages.component';
import { GopDeductionComponent } from 'app/gop-deduction/gop-deduction.component';
import { FinancialOverviewComponent } from 'app/financial-overview/financial-overview.component';
import { AllSessionsComponent } from 'app/all-sessions/all-sessions.component';



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
    { path: 'purchase-order',        component: PurchaseOrderComponent },
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
    {path:'detailed-report',component:DetailedReportComponent},
    {path:'add-purchase',component:AddPurchaseRequestComponent},
    {path:'expenses',component:ExpensesComponent},
    {path:'add-budget',component:BudgetComponent},
    {path:'income',component:IncomeComponent},
    {path:'budget-report',component:BudgetReportComponent},
    {path:'daily-income',component:DailyIncomeReportComponent},
    {path:'daily-income-dates',component:DailyIncomeReportDatesBetweenComponent},
    {path:'item',component:ItemComponent},

    {path:'item-unit',component:ItemGroupComponent},
    {path:'item-receieved',component:ReceivedItemsComponent},
    {path:'item-family',component:ItemFamilyComponent},
    {path:'item-category',component:ItemCategoryComponent},
    {path:'item-store',component:StoreComponent},
    {path:'item-stock',component:StockComponent},

    {path:'department',component:DepartmentsComponent},
    {path:'item-transfer',component:TransferStockComponent},
    {path:'vendor',component:VendorComponent},
    {path:'return-request',component:ReturnRequestComponent},
    {path:'general-ledger',component:GeneralLedgerComponent},
    {path:'account-receivable',component:AccountReceivableComponent},

    {path:'general-ledger-dates',component:LedgerPagesComponent},
    {path:'account-receivable-dates',component:AccountReceivablePagesComponent},
    {path:'gop-deduction',component:GopDeductionComponent},
    {path:'financial-overview',component:FinancialOverviewComponent},
    {path:'all-sessions',component:AllSessionsComponent},

]
