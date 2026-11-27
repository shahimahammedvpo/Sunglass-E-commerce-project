
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

export const customerGuard: CanActivateFn = () => {

  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectAuthGuardStatus).pipe(

    filter(auth => !auth.loading),
    take(1),

    map(auth => {

      const user = auth.currentUser;

      // Allow guests to access public customer pages
      if (!auth.isAuthenticated || !user) {
        return true;
      }

      // Blocked users cannot access customer pages
      if (user.isBlocked === true) {
        return router.createUrlTree(['/login']);
      }

      // Admins must remain in the admin panel
      if (user.role === 'admin') {
        return router.createUrlTree(['/admin/dashboard']);
      }

      return true;

    })

  );

};
