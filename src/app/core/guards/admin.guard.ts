
import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import { Store } from '@ngrx/store';

import {
  filter,
  take,
  map
} from 'rxjs';

import {
  selectAuthGuardStatus
} from '../../store/auth/auth.selectors';

export const adminGuard: CanActivateFn = () => {

  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectAuthGuardStatus).pipe(

    filter(auth => !auth.loading),

    take(1),

    map(auth => {

      const user = auth.currentUser;

      // Not logged in or blocked
      if (
        !auth.isAuthenticated ||
        !user ||
        user.isBlocked === true
      ) {
        return router.createUrlTree(['/login']);
      }

      // Only admins can access the admin panel
      if (user.role === 'admin') {
        return true;
      }

      // Customers cannot access admin pages
      if (user.role === 'customer') {
        return router.createUrlTree(['/']);
      }

      return router.createUrlTree(['/login']);

    })

  );

};
