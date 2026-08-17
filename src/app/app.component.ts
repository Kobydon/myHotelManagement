import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { userService } from './user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isUserLoggedIn = false;
  isAdmin = false;
  checking = false;

  constructor(
    private toastr: ToastrService,
    private router: Router,
    private userService: userService
  ) {}

  ngOnInit() {
    const storeData = localStorage.getItem('isUserLoggedIn');
    const adminData = localStorage.getItem('isAdmin');
    const barData = localStorage.getItem('isBartender');
    const waiterData = localStorage.getItem('isWaiter');
    const kitchenData = localStorage.getItem('digital_printing');
    const dtfData = localStorage.getItem('dtf');
    const checkData = localStorage.getItem('checking');
    const labelData = localStorage.getItem('label');
     const giverData = localStorage.getItem('isgiver');
    const customerData = localStorage.getItem('iscustomer');
     console.log('is logged in', storeData);

    if (storeData === 'true') {
      this.isUserLoggedIn = true;

      if (adminData === 'true') {
        this.redirectAndLogout('/dashboard');
      } else if (kitchenData === 'true') {
        this.redirectAndLogout('/view-order');
      } else if (waiterData === 'true') {
        this.redirectAndLogout('/item-list');
      } else if (barData === 'true') {
        this.redirectAndLogout('/view-large-format-order');
      } else if (dtfData === 'true') {
        this.redirectAndLogout('/view-dtf-order');
      } else if (labelData === 'true') {
        this.redirectAndLogout('/view-label-order');
      } else if (giverData === 'true') {
        this.redirectAndLogout('/view-all-order');
      }

       else if (customerData === 'true') {
        this.redirectAndLogout('/customer-category');
      }
    } else {
      this.isUserLoggedIn = false;
      this.toastr.error(null, 'Session expired, kindly login again');
      this.userService.logout();
    }

    this.checking = checkData === 'true';
    console.log('Admin status:', adminData);
  }

  private redirectAndLogout(route: string) {
    this.router.navigate([route]);
    // this.userService.logout();
  }
}
