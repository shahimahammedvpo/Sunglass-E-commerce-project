
import { Injectable, inject } from '@angular/core';

import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import { of } from 'rxjs';

import {
  map,
  exhaustMap,
  catchError,
  tap
} from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';

import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {

  private actions$ = inject(Actions);
  private authService = inject(AuthService);

  // ============================================
  // REGISTER
  // ============================================

  register$ = createEffect(() =>
    this.actions$.pipe(

      ofType(AuthActions.register),

      exhaustMap(action =>
        this.authService.register(
          action.fullName,
          action.email,
          action.password
        ).pipe(

          map(result => {

            if (result.success) {
              return AuthActions.registerSuccess({
                message: result.message
              });
            }

            return AuthActions.registerFailure({
              error: result.message
            });

          }),

          catchError(error =>
            of(
              AuthActions.registerFailure({
                error: error.message ||
                  'Unable to register. Please try again.'
              })
            )
          )

        )
      )

    )
  );

  // ============================================
  // LOGIN
  // ============================================

  login$ = createEffect(() =>
    this.actions$.pipe(

      ofType(AuthActions.login),

      exhaustMap(action =>
        this.authService.login(
          action.email,
          action.password
        ).pipe(

          map(result => {

            if (result.success && result.user) {
              return AuthActions.loginSuccess({
                user: result.user,
                message: result.message
              });
            }

            return AuthActions.loginFailure({
              error: result.message
            });

          }),

          catchError(error =>
            of(
              AuthActions.loginFailure({
                error: error.message ||
                  'Unable to login. Please try again.'
              })
            )
          )

        )
      )

    )
  );

  // ============================================
  // LOGOUT
  // ============================================

  logout$ = createEffect(() =>
    this.actions$.pipe(

      ofType(AuthActions.logout),

      tap(() => {
        this.authService.logout();
      }),

      map(() =>
        AuthActions.logoutSuccess()
      )

    )
  );

  // ============================================
  // RESTORE AND VERIFY SESSION
  // ============================================

  restoreSession$ = createEffect(() =>
    this.actions$.pipe(

      ofType(AuthActions.restoreSession),

      exhaustMap(() =>
        this.authService.verifyCurrentUser().pipe(

          map(user =>
            AuthActions.restoreSessionSuccess({
              user
            })
          ),

          catchError(error => {

            console.error(
              'Session restoration error:',
              error
            );

            return of(
              AuthActions.restoreSessionSuccess({
                user: null
              })
            );

          })

        )
      )

    )
  );

  // ============================================
  // UPDATE PROFILE
  // ============================================

  updateProfile$ = createEffect(() =>
    this.actions$.pipe(

      ofType(AuthActions.updateProfile),

      exhaustMap(action =>
        this.authService.updateProfile(
          action.fullName,
          action.email
        ).pipe(

          map(result => {

            if (result.success && result.user) {
              return AuthActions.updateProfileSuccess({
                user: result.user,
                message: result.message
              });
            }

            return AuthActions.updateProfileFailure({
              error: result.message
            });

          }),

          catchError(error =>
            of(
              AuthActions.updateProfileFailure({
                error: error.message ||
                  'Unable to update profile. Please try again.'
              })
            )
          )

        )
      )

    )
  );

  // ============================================
  // UPDATE PROFILE IMAGE
  // ============================================

  updateProfileImage$ = createEffect(() =>
    this.actions$.pipe(

      ofType(AuthActions.updateProfileImage),

      exhaustMap(action =>
        this.authService.updateProfileImage(
          action.image
        ).pipe(

          map(result => {

            if (result.success && result.user) {
              return AuthActions.updateProfileImageSuccess({
                user: result.user,
                message: result.message
              });
            }

            return AuthActions.updateProfileImageFailure({
              error: result.message
            });

          }),

          catchError(error =>
            of(
              AuthActions.updateProfileImageFailure({
                error: error.message ||
                  'Unable to update profile image. Please try again.'
              })
            )
          )

        )
      )

    )
  );

}
