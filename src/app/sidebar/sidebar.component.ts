import { Component, OnInit } from '@angular/core';
import { routeAnimations } from 'app/shared/animation';


export interface RouteInfo {
    path: string;
    title: string;
    icon: string;
    class: string;
}

export const ROUTES: RouteInfo[] = [
    { path: '/dashboard',     title: 'Dashboard',         icon:'nc-bank',       class: '' },
    { path: '/all-users',     title: 'Users',         icon:'nc-bank',       class: '' },
    { path: '/room-types',     title: 'Room Types',         icon:'nc-bank',       class: '' },
    
    { path: '/icons',         title: 'Icons',             icon:'nc-diamond',    class: '' },
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
];

@Component({
    moduleId: module.id,
    selector: 'sidebar-cmp',
    templateUrl: 'sidebar.component.html',
 
})

export class SidebarComponent implements OnInit {
    public menuItems: any[];
    ngOnInit() {
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
    


}