import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  CanActivate,
  Router,
} from '@angular/router';
import { ROLE_CONFIG, getUserRoles } from './roles';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    _: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const loggedIn = localStorage.getItem('isUserLoggedIn') === 'true';

    if (!loggedIn) {
      // If they're already heading to signin, let them through
      if (state.url.startsWith('/account/signin')) return true;
      return this.router.createUrlTree(['/account/signin']);
    }

    // Logged in → if they try to visit signin, send to their home
    if (state.url.startsWith('/account/signin')) {
      const role = getUserRoles()[0];
      if (role) return this.router.createUrlTree([ROLE_CONFIG[role].route]);
      return this.router.createUrlTree(['/account/signin']);
    }

    return true;
  }
}