export enum Role {
  Admin          = 'admin',
  DigitalPrinting = 'digital_printing',
  Waiter         = 'isWaiter',
  Bartender      = 'isBartender',
  Dtf            = 'dtf',
  Label          = 'label',
  Giver          = 'isgiver',
  Customer       = 'iscustomer',
  uvdtf          = 'uvdtf',
}

/**
 * Maps each role to its localStorage flag and its default landing route.
 */
export const ROLE_CONFIG: Record<Role, { flag: string; route: string }> = {
  [Role.Admin]:           { flag: 'isAdmin',           route: '/admin/main' },
  [Role.DigitalPrinting]: { flag: 'digital_printing',  route: '/view-order' },
  [Role.Waiter]:          { flag: 'isWaiter',          route: '/item-list' },
  [Role.Bartender]:       { flag: 'isBartender',       route: '/view-large-format-order' },
  [Role.Dtf]:             { flag: 'dtf',               route: '/view-dtf-order' },
  [Role.Label]:           { flag: 'label',             route: '/view-label-order' },
  [Role.Giver]:           { flag: 'isgiver',           route: '/view-all-order' },
  [Role.Customer]:        { flag: 'iscustomer',        route: '/customer-category' },
  [Role.uvdtf]:           { flag: 'uvdtf',             route: '/view-uvdtf-order' },
};

/**
 * Reads all roles a user currently has (from localStorage flags).
 */
export function getUserRoles(): Role[] {
  return (Object.keys(ROLE_CONFIG) as Role[]).filter(
    (role) => localStorage.getItem(ROLE_CONFIG[role].flag) === 'true'
  );
}

export function isLoggedIn(): boolean {
  return localStorage.getItem('isUserLoggedIn') === 'true';
}