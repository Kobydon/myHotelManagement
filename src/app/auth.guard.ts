import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  CanActivate,
  Router
} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {

    const isLoggedIn =
      localStorage.getItem('isUserLoggedIn') === 'true';

    console.log('Guard URL:', state.url);
    console.log('Logged in:', isLoggedIn);

    // User is NOT logged in
    if (!isLoggedIn) {
      return this.router.createUrlTree(['/account/signin']);
    }

    // User is already logged in and tries to access login
    if (state.url === '/account/signin') {
      return this.getDefaultRoute();
    }

    // User is logged in → allow requested route
    return true;
  }

  private getDefaultRoute(): UrlTree {

    if (localStorage.getItem('isAdmin') === 'true') {
      return this.router.createUrlTree(['/admin/main']);
    }

    if (localStorage.getItem('digital_printing') === 'true') {
      return this.router.createUrlTree(['/view-order']);
    }

    if (localStorage.getItem('isWaiter') === 'true') {
      return this.router.createUrlTree(['/item-list']);
    }

    if (localStorage.getItem('isBartender') === 'true') {
      return this.router.createUrlTree([
        '/view-large-format-order'
      ]);
    }

    if (localStorage.getItem('dtf') === 'true') {
      return this.router.createUrlTree(['/view-dtf-order']);
    }

    if (localStorage.getItem('label') === 'true') {
      return this.router.createUrlTree(['/view-label-order']);
    }

    if (localStorage.getItem('isgiver') === 'true') {
      return this.router.createUrlTree(['/view-all-order']);
    }

    if (localStorage.getItem('iscustomer') === 'true') {
      return this.router.createUrlTree(['/customer-category']);
    }

    // Logged in but no recognized role
    return this.router.createUrlTree(['/account/signin']);
  }
}
