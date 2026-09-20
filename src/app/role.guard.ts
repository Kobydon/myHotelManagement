import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  CanActivate,
  Router,
} from '@angular/router';
import { Role, ROLE_CONFIG, getUserRoles, isLoggedIn } from './roles';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    // 1. Must be logged in at all
    if (!isLoggedIn()) {
      return this.router.createUrlTree(['/account/signin']);
    }

    // 2. Read allowed roles from route data
    const allowedRoles = route.data?.['roles'] as Role[] | undefined;

    // If no roles declared → treat as "any logged-in user"
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    // 3. Check user roles
    const userRoles = getUserRoles();
    const hasAccess = allowedRoles.some((r) => userRoles.includes(r));

    if (hasAccess) {
      return true;
    }

    // 4. Not authorized → bounce them to *their* home, not signin
    console.warn(
      `[RoleGuard] Access denied to ${state.url}. ` +
      `User roles: [${userRoles.join(', ')}], required: [${allowedRoles.join(', ')}]`
    );

    return this.getDefaultRouteFor(userRoles);
  }

  private getDefaultRouteFor(userRoles: Role[]): UrlTree {
    const firstRole = userRoles[0];
    if (firstRole) {
      return this.router.createUrlTree([ROLE_CONFIG[firstRole].route]);
    }
    return this.router.createUrlTree(['/account/signin']);
  }
}