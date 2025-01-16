import { Component, OnInit } from '@angular/core';
import { routeAnimations } from 'app/shared/animation';
import { userService } from 'app/user.service';


export interface RouteInfo {
    path: string;
    title: string;
    icon: string;
    class: string;
}

export const ROUTES: RouteInfo[] = [
    { path: '/dashboard',     title: 'Dashboard',         icon:'nc-bank',       class: '' },
    { path: '/expenses',    title: ' Expenses ',        icon:'nc-caps-small', class: '' },
    { path: '/refund-list',     title: 'Refund List',         icon:'nc-bank',       class: '' },
    { path: '/add-purchase',     title: ' Add Purchase Request',         icon:'nc-bank',       class: '' },
    { path: '/all-users',     title: 'Users',         icon:'nc-bank',       class: '' },
    { path: '/room-types',     title: 'Room Types',         icon:'nc-bank',       class: '' },
    { path: '/purchase-request',     title: 'Purchase Request',         icon:'nc-bank',       class: '' },
    { path: '/purchase-order',     title: 'Purchase Request',         icon:'nc-bank',       class: '' },
    { path: '/icons',         title: 'Icons',             icon:'nc-diamond',    class: '' },
    { path: '/calender',         title: 'Calender',             icon:'nc-diamond',    class: '' },
    { path: '/maps',          title: 'Maps',              icon:'nc-pin-3',      class: '' },
    { path: '/notifications', title: 'Notifications',     icon:'nc-bell-55',    class: '' },
    { path: '/user',          title: 'User Profile',      icon:'nc-single-02',  class: '' },
    { path: '/table',         title: 'Table List',        icon:'nc-tile-56',    class: '' },
    { path: '/typography',    title: 'Typography',        icon:'nc-caps-small', class: '' },
    { path: '/upgrade',       title: 'Upgrade to PRO',    icon:'nc-spaceship',  class: 'active-pro' },
    { path: '/all-rooms',    title: 'Rooms',        icon:'nc-caps-small', class: '' },
    { path: '/room-status',    title: 'Rooms Status',        icon:'nc-caps-small', class: '' },
    { path: '/all-guest',    title: 'Guest List',        icon:'nc-caps-small', class: '' },
    { path: '/all-bookings',    title: 'Booking List',        icon:'nc-caps-small', class: '' },
    { path: '/payment',    title: 'Payment List',        icon:'nc-caps-small', class: '' },
    { path: '/employees',    title: 'Employee List',        icon:'nc-caps-small', class: '' },
    { path: '/attendance',    title: 'Attendance List',        icon:'nc-caps-small', class: '' },
    { path: '/all-reservations',    title: 'Reservation List',        icon:'nc-caps-small', class: '' },
    { path: '/todo-list',    title: 'Todo List',        icon:'nc-caps-small', class: '' },
    { path: '/house-keeping',    title: 'House Keeping List',        icon:'nc-caps-small', class: '' },
    { path: '/detailed-report',    title: 'Detailed Sales and Business Activity Report',        icon:'nc-caps-small', class: '' },
    { path: '/budget-report',    title: 'Budget Report',        icon:'nc-caps-small', class: '' },
    { path: '/expenses',    title: ' Expenses ',        icon:'nc-caps-small', class: '' },
    { path: '/income',    title: ' Income ',        icon:'nc-caps-small', class: '' },
    { path: '/add-budget',    title: ' Budget ',        icon:'nc-caps-small', class: '' },
    { path: '/daily-income',    title: ' Daily Income - Expenditure Report  ',        icon:'nc-caps-small', class: '' },
    { path: '/daily-income-dates',    title: ' Daily Income - Expenditure Report  ',        icon:'nc-caps-small', class: '' },
    { path: '/item',    title: ' Items ',        icon:'nc-caps-small', class: '' },
    { path: '/item-received',    title: ' Received Items ',        icon:'nc-caps-small', class: '' },

    { path: '/item-unit',    title: ' Item Unit',        icon:'nc-caps-small', class: '' },
    { path: '/item-family',    title: ' Item  Family ',        icon:'nc-caps-small', class: '' },
    { path: '/item-category',    title: ' Item Category ',        icon:'nc-caps-small', class: '' },
    { path: '/return-request',    title: ' Item Category ',        icon:'nc-caps-small', class: '' },
    { path: '/general-ledger',    title: ' General Ledger ',        icon:'nc-caps-small', class: '' },
    { path: '/account-receivable',    title: ' Account Recievable ',        icon:'nc-caps-small', class: '' },
  

    { path: '/item-store',    title: ' Item  Store ',        icon:'nc-caps-small', class: '' },
    { path: '/item-stock',    title: ' Item Stock ',        icon:'nc-caps-small', class: '' },


    { path: '/item-transfer',    title: ' Item  Transfer ',        icon:'nc-caps-small', class: '' },
    { path: '/department',    title: ' Item Stock ',        icon:'nc-caps-small', class: '' },

    { path: '/general-ledger-dates',    title: ' General Ledger  ',        icon:'nc-caps-small', class: '' },
    { path: '/account-receivable-dates',    title: ' Account Recievable  Dates',        icon:'nc-caps-small', class: '' },
    

    { path: '/vendor',    title: ' Vendor  ',        icon:'nc-caps-small', class: '' },
    { path: '/gop-deduction',    title: ' Gop Dedutcion  ',        icon:'nc-caps-small', class: '' },

];

@Component({
    moduleId: module.id,
    selector: 'sidebar-cmp',
    templateUrl: 'sidebar.component.html',
 
})

export class SidebarComponent implements OnInit {
    user:any;
    constructor(private userService:userService){}
    public menuItems: any[];
    ngOnInit() {
        this.getUser();
        this.menuItems = ROUTES.filter(menuItem => menuItem);


        let dropdown = document.getElementsByClassName(" transparent");
        let i:any;
      
      for (i = 0; i < dropdown.length; i++) {
        dropdown[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var dropdownContent = this.nextElementSibling;
        if (dropdownContent.style.display === "block") {
        dropdownContent.style.display = "none";
        } else {
        dropdownContent.style.display = "block";
        }
        });
      }
         }
    

         async getUser(){
            try{
                var res = await this.userService.getUser()
                if (res) this.user=res;

            }catch(err){console.log(err)}
            finally{console.log("success");}
          


         }


         myFunctionside() {

            var input, filter, ul,li, a,i,  txtValue;
            input = document.getElementById("myInputside");
            filter = input.value.toUpperCase();
            ul = document.getElementById("navlink");
            li = ul.getElementsByTagName("li");
            for (i = 0; i < li.length; i++) {
              a = li[i].getElementsByTagName("a")[0];
          
              if (a) {
                txtValue = a.textContent || a.innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                  li[i].style.display = "";
                } else {
                  li[i].style.display = "none";
                }
                
              }       
            }
          }
          

}