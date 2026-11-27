
import { Injectable, inject } from '@angular/core';

import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import { Store } from '@ngrx/store';

import {
  combineLatest,
  of
} from 'rxjs';

import {
  concatMap,
  switchMap,
  map,
  catchError,
  tap,
  take
} from 'rxjs/operators';

import { WishlistService } from '../../core/services/wishlist.service';
import { ToastService } from '../../core/services/toast.service';

import { selectCurrentUser } from '../auth/auth.selectors';
import { selectWishlistProducts } from './wishlist.selectors';

import * as WishlistActions from './wishlist.actions';

@Injectable()
export class WishlistEffects {

  private actions$ = inject(Actions);
  private store = inject(Store);

  private wishlistService = inject(WishlistService);
  private toastService = inject(ToastService);

  private readonly MAX_WISHLIST_PRODUCTS = 10;

  // =====================================================
  // LOAD WISHLIST
  // =====================================================

  loadWishlist$ = createEffect(() =>
    this.actions$.pipe(

      ofType(WishlistActions.loadWishlist),

      switchMap(() =>
        this.store.select(selectCurrentUser).pipe(

          take(1),

          switchMap(user => {

            if (!user) {
              return of(
                WishlistActions.loadWishlistSuccess({
                  products: []
                })
              );
            }

            return this.wishlistService.loadWishlist(user.id).pipe(

              map(products =>
                WishlistActions.loadWishlistSuccess({
                  products
                })
              ),

              catchError(error =>
                of(
                  WishlistActions.wishlistFailure({
                    error: error.message || 'Unable to load wishlist.'
                  })
                )
              )

            );

          })

        )
      )

    )
  );

  // =====================================================
  // ADD PRODUCT TO WISHLIST
  // =====================================================

  addToWishlist$ = createEffect(() =>
    this.actions$.pipe(

      ofType(WishlistActions.addToWishlist),

      // Process mutations sequentially
      concatMap(({ product }) =>

        combineLatest([
          this.store.select(selectCurrentUser).pipe(take(1)),
          this.store.select(selectWishlistProducts).pipe(take(1))
        ]).pipe(

          switchMap(([user, products]) => {

            if (!user) {
              return of(
                WishlistActions.addToWishlistFailure({
                  error: 'Please login to add products to your wishlist.'
                })
              );
            }

            // Prevent duplicate products
            const alreadyExists = products.some(
              item => item.id === product.id
            );

            if (alreadyExists) {
              return of(
                WishlistActions.addToWishlistFailure({
                  error: 'This product is already in your wishlist.'
                })
              );
            }

            // Check wishlist limit
            if (products.length >= this.MAX_WISHLIST_PRODUCTS) {
              return of(
                WishlistActions.addToWishlistFailure({
                  error: `Wishlist limit reached. You can add a maximum of ${this.MAX_WISHLIST_PRODUCTS} products.`
                })
              );
            }

            const updatedProducts = [
              ...products,
              product
            ];

            return this.wishlistService.saveWishlist(
              user.id,
              updatedProducts
            ).pipe(

              map(savedProducts =>
                WishlistActions.addToWishlistSuccess({
                  products: savedProducts
                })
              ),

              catchError(error =>
                of(
                  WishlistActions.addToWishlistFailure({
                    error: error.message || 'Unable to add product to wishlist.'
                  })
                )
              )

            );

          })

        )

      )

    )
  );

  // =====================================================
  // REMOVE PRODUCT FROM WISHLIST
  // =====================================================

  removeFromWishlist$ = createEffect(() =>
    this.actions$.pipe(

      ofType(WishlistActions.removeFromWishlist),

      concatMap(({ productId }) =>

        combineLatest([
          this.store.select(selectCurrentUser).pipe(take(1)),
          this.store.select(selectWishlistProducts).pipe(take(1))
        ]).pipe(

          switchMap(([user, products]) => {

            if (!user) {
              return of(
                WishlistActions.removeFromWishlistFailure({
                  productId,
                  error: 'Please login first.'
                })
              );
            }

            const updatedProducts = products.filter(
              product => product.id !== productId
            );

            // No API request if the product was not present
            if (updatedProducts.length === products.length) {
              return of(
                WishlistActions.removeFromWishlistSuccess({
                  products
                })
              );
            }

            return this.wishlistService.saveWishlist(
              user.id,
              updatedProducts
            ).pipe(

              map(savedProducts =>
                WishlistActions.removeFromWishlistSuccess({
                  products: savedProducts
                })
              ),

              catchError(error =>
                of(
                  WishlistActions.removeFromWishlistFailure({
                    productId,
                    error: error.message || 'Unable to remove product from wishlist.'
                  })
                )
              )

            );

          })

        )

      )

    )
  );

  // =====================================================
  // CLEAR WISHLIST
  // =====================================================

  clearWishlist$ = createEffect(() =>
    this.actions$.pipe(

      ofType(WishlistActions.clearWishlist),

      concatMap(() =>

        combineLatest([
          this.store.select(selectCurrentUser).pipe(take(1)),
          this.store.select(selectWishlistProducts).pipe(take(1))
        ]).pipe(

          switchMap(([user, products]) => {

            if (!user) {
              return of(
                WishlistActions.clearWishlistFailure({
                  error: 'Please login first.'
                })
              );
            }

            // No API request if already empty
            if (products.length === 0) {
              return of(
                WishlistActions.clearWishlistSuccess({
                  products: []
                })
              );
            }

            return this.wishlistService.saveWishlist(
              user.id,
              []
            ).pipe(

              map(savedProducts =>
                WishlistActions.clearWishlistSuccess({
                  products: savedProducts
                })
              ),

              catchError(error =>
                of(
                  WishlistActions.clearWishlistFailure({
                    error: error.message || 'Unable to clear wishlist.'
                  })
                )
              )

            );

          })

        )

      )

    )
  );

  // =====================================================
  // TOAST NOTIFICATIONS
  // =====================================================

  addWishlistToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(WishlistActions.addToWishlistSuccess),
        tap(() => {
          this.toastService.success('Added to wishlist!');
        })
      ),
    { dispatch: false }
  );

  addWishlistErrorToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(WishlistActions.addToWishlistFailure),
        tap(({ error }) => {
          this.toastService.error(error);
        })
      ),
    { dispatch: false }
  );

  removeWishlistToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(WishlistActions.removeFromWishlistSuccess),
        tap(() => {
          this.toastService.info('Removed from wishlist!');
        })
      ),
    { dispatch: false }
  );

  removeWishlistErrorToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(WishlistActions.removeFromWishlistFailure),
        tap(({ error }) => {
          this.toastService.error(error);
        })
      ),
    { dispatch: false }
  );

  clearWishlistToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(WishlistActions.clearWishlistSuccess),
        tap(() => {
          this.toastService.info('Wishlist cleared successfully!');
        })
      ),
    { dispatch: false }
  );

  clearWishlistErrorToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(WishlistActions.clearWishlistFailure),
        tap(({ error }) => {
          this.toastService.error(error);
        })
      ),
    { dispatch: false }
  );

  loadWishlistErrorToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(WishlistActions.wishlistFailure),
        tap(({ error }) => {
          this.toastService.error(error);
        })
      ),
    { dispatch: false }
  );

}
