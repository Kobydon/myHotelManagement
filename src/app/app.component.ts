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
    const kitchenData = localStorage.getItem('isKitchen');
    const checkData = localStorage.getItem('checking');

    if (storeData === 'true') {
      this.isUserLoggedIn = true;

      if (adminData === 'true') {
        this.redirectAndLogout('/dashboard');
      } else if (kitchenData === 'true') {
        this.redirectAndLogout('/view-order');
      } else if (waiterData === 'true') {
        this.redirectAndLogout('/item-order');
      } else if (barData === 'true') {
        this.redirectAndLogout('/view-drink-order');
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
    this.userService.logout();
  }
}
