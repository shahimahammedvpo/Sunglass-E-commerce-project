
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

export const authGuard: CanActivateFn = (route, state) => {

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
        return router.createUrlTree(['/login'], {
          queryParams: {
            returnUrl: state.url
          }
        });
      }

      // Admin cannot access customer pages
      if (user.role === 'admin') {
        return router.createUrlTree(['/admin/dashboard']);
      }

      // Only customers are allowed
      if (user.role === 'customer') {
        return true;
      }

      return router.createUrlTree(['/login']);

    })

  );

};
