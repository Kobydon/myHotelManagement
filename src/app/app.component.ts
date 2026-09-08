import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { userService } from './user.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  isUserLoggedIn = false;
  isAdmin = false;
  checking = false;

  private routerSubscription?: Subscription;

  constructor(
    private toastr: ToastrService,
    private router: Router,
    private userService: userService
  ) {}

  ngOnInit(): void {
    // Check login status when app starts
    this.checkLoginStatus();

    // Check login status whenever navigation finishes
    this.routerSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.checkLoginStatus();
      });
  }

  private checkLoginStatus(): void {
    this.isUserLoggedIn =
      localStorage.getItem('isUserLoggedIn') === 'true';

    this.isAdmin =
      localStorage.getItem('isAdmin') === 'true';
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }
}
