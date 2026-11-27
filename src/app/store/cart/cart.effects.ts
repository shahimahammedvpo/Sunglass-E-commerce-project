
import { Injectable, inject } from '@angular/core';

import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import { Store } from '@ngrx/store';

import {
  of,
  combineLatest
} from 'rxjs';

import {
  catchError,
  map,
  switchMap,
  concatMap,
  tap,
  take
} from 'rxjs/operators';

import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';

import { selectCurrentUser } from '../auth/auth.selectors';
import { selectCartItems } from './cart.selectors';

import * as CartActions from './cart.actions';

import {
  validateAddToCart,
  validateCartQuantity
} from './cart.validation';

@Injectable()
export class CartEffects {

  private actions$ = inject(Actions);
  private store = inject(Store);

  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  // ============================================
  // LOAD CART
  // ============================================

  loadCart$ = createEffect(() =>
    this.actions$.pipe(

      ofType(CartActions.loadCart),

      switchMap(() =>
        this.store.select(selectCurrentUser).pipe(

          take(1),

          switchMap(user => {

            if (!user) {
              return of(
                CartActions.loadCartSuccess({
                  items: []
                })
              );
            }

            return this.cartService.loadCart(user.id).pipe(

              map(items =>
                CartActions.loadCartSuccess({ items })
              ),

              catchError(error =>
                of(
                  CartActions.loadCartFailure({
                    error: error?.message || 'Unable to load cart.'
                  })
                )
              )

            );

          })

        )
      )

    )
  );

  // ============================================
  // ADD TO CART
  // ============================================

  addToCart$ = createEffect(() =>
    this.actions$.pipe(

      ofType(CartActions.addToCart),

      concatMap(action =>

        combineLatest([
          this.store.select(selectCurrentUser).pipe(take(1)),
          this.store.select(selectCartItems).pipe(take(1))
        ]).pipe(

          switchMap(([user, cart]) => {

            if (!user) {
              return of(
                CartActions.addToCartFailure({
                  error: 'Please login to add products to your cart.',
                  productId: action.product.id
                })
              );
            }

            const validationError = validateAddToCart(
              action.product,
              action.quantity,
              cart
            );

            if (validationError) {
              return of(
                CartActions.addToCartFailure({
                  error: validationError,
                  productId: action.product.id
                })
              );
            }

            const updatedCart = [...cart];

            const existingItem = updatedCart.find(
              item => item.product.id === action.product.id
            );

            if (existingItem) {
              existingItem.quantity += action.quantity;
            } else {
              updatedCart.push({
                product: action.product,
                quantity: action.quantity
              });
            }

            return this.cartService.saveCart(
              user.id,
              updatedCart
            ).pipe(

              map(items =>
                CartActions.addToCartSuccess({
                  items,
                  productId: action.product.id,
                  showToast: action.showToast ?? true
                })
              ),

              catchError(error =>
                of(
                  CartActions.addToCartFailure({
                    error: error?.message || 'Unable to add product.',
                    productId: action.product.id
                  })
                )
              )

            );

          })

        )

      )

    )
  );

  // ============================================
  // UPDATE QUANTITY
  // ============================================

  updateCartQuantity$ = createEffect(() =>
    this.actions$.pipe(

      ofType(CartActions.updateCartQuantity),

      concatMap(action =>

        combineLatest([
          this.store.select(selectCurrentUser).pipe(take(1)),
          this.store.select(selectCartItems).pipe(take(1))
        ]).pipe(

          switchMap(([user, cart]) => {

            if (!user) {
              return of(
                CartActions.updateCartQuantityFailure({
                  error: 'Please login first.'
                })
              );
            }

            const existingItem = cart.find(
              item => item.product.id === action.productId
            );

            if (!existingItem) {
              return of(
                CartActions.updateCartQuantityFailure({
                  error: 'Product not found in your cart.'
                })
              );
            }

            const validationError = validateCartQuantity(
              existingItem.product,
              action.quantity
            );

            if (validationError) {
              return of(
                CartActions.updateCartQuantityFailure({
                  error: validationError
                })
              );
            }

            const updatedCart = cart.map(item =>
              item.product.id === action.productId
                ? { ...item, quantity: action.quantity }
                : item
            );

            return this.cartService.saveCart(
              user.id,
              updatedCart
            ).pipe(

              map(items =>
                CartActions.updateCartQuantitySuccess({ items })
              ),

              catchError(error =>
                of(
                  CartActions.updateCartQuantityFailure({
                    error: error?.message || 'Unable to update quantity.'
                  })
                )
              )

            );

          })

        )

      )

    )
  );

  // ============================================
  // REMOVE FROM CART
  // ============================================

  removeFromCart$ = createEffect(() =>
    this.actions$.pipe(

      ofType(CartActions.removeFromCart),

      concatMap(action =>

        combineLatest([
          this.store.select(selectCurrentUser).pipe(take(1)),
          this.store.select(selectCartItems).pipe(take(1))
        ]).pipe(

          switchMap(([user, cart]) => {

            if (!user) {
              return of(
                CartActions.removeFromCartFailure({
                  error: 'Please login first.'
                })
              );
            }

            const updatedCart = cart.filter(
              item => item.product.id !== action.productId
            );

            if (updatedCart.length === cart.length) {
              return of(
                CartActions.removeFromCartSuccess({
                  items: cart
                })
              );
            }

            return this.cartService.saveCart(
              user.id,
              updatedCart
            ).pipe(

              map(items =>
                CartActions.removeFromCartSuccess({ items })
              ),

              catchError(error =>
                of(
                  CartActions.removeFromCartFailure({
                    error: error?.message || 'Unable to remove product.'
                  })
                )
              )

            );

          })

        )

      )

    )
  );

  // ============================================
  // CLEAR CART
  // ============================================

  clearCart$ = createEffect(() =>
    this.actions$.pipe(

      ofType(CartActions.clearCart),

      concatMap(() =>

        combineLatest([
          this.store.select(selectCurrentUser).pipe(take(1)),
          this.store.select(selectCartItems).pipe(take(1))
        ]).pipe(

          switchMap(([user, cart]) => {

            if (!user) {
              return of(
                CartActions.clearCartFailure({
                  error: 'Please login first.'
                })
              );
            }

            if (cart.length === 0) {
              return of(
                CartActions.clearCartSuccess({
                  items: []
                })
              );
            }

            return this.cartService.saveCart(
              user.id,
              []
            ).pipe(

              map(items =>
                CartActions.clearCartSuccess({ items })
              ),

              catchError(error =>
                of(
                  CartActions.clearCartFailure({
                    error: error?.message || 'Unable to clear cart.'
                  })
                )
              )

            );

          })

        )

      )

    )
  );

  // ============================================
  // ADD SUCCESS TOAST
  // ============================================

  addToCartToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(CartActions.addToCartSuccess),

        tap(({ showToast }) => {

          if (showToast !== false) {
            this.toastService.success(
              'Product added to cart successfully!'
            );
          }

        })
      ),
    { dispatch: false }
  );

  // ============================================
  // ADD FAILURE TOAST
  // ============================================

  addToCartErrorToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(CartActions.addToCartFailure),

        tap(({ error }) => {
          this.toastService.error(error);
        })
      ),
    { dispatch: false }
  );

  // ============================================
  // UPDATE SUCCESS TOAST
  // ============================================

  updateCartToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(CartActions.updateCartQuantitySuccess),

        tap(() => {
          this.toastService.success(
            'Cart quantity updated!'
          );
        })
      ),
    { dispatch: false }
  );

  // ============================================
  // UPDATE FAILURE TOAST
  // ============================================

  updateCartErrorToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(CartActions.updateCartQuantityFailure),

        tap(({ error }) => {
          this.toastService.error(error);
        })
      ),
    { dispatch: false }
  );

}
