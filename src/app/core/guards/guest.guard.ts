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

export const guestGuard: CanActivateFn = () => {

  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectAuthGuardStatus).pipe(

    // Wait until authentication initialization finishes
    filter(auth => !auth.loading),

    take(1),

    map(auth => {

      if (auth.isAuthenticated) {
        return router.createUrlTree(['/']);
      }

      return true;

    })

  );

};