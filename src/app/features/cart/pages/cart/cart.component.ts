import {
  Component,
  inject,
  OnInit,
  DestroyRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';

import { take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CartItem } from '../../../../core/services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';

import {
  MAX_CART_PRODUCTS,
  MAX_PRODUCT_QUANTITY
} from '../../../../store/cart/cart.validation';

import {
  loadCart,
  updateCartQuantity,
  removeFromCart,
  removeFromCartSuccess,
  removeFromCartFailure,
  clearCart,
  clearCartSuccess,
  clearCartFailure
} from '../../../../store/cart/cart.actions';

import {
  selectCartItems,
  selectCartLoading,
  selectCartError,
  selectCartSubtotal,
  selectCartCount
} from '../../../../store/cart/cart.selectors';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {

  private store = inject(Store);
  private actions$ = inject(Actions);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);

  // Cart data from NgRx selectors
  cartItems: CartItem[] = [];

  loading = true;
  error = '';

  subtotal = 0;
  totalItems = 0;

  // Cart limits from validation file
  readonly MAX_CART_PRODUCTS = MAX_CART_PRODUCTS;
  readonly MAX_PRODUCT_QUANTITY = MAX_PRODUCT_QUANTITY;

  // Confirmation modal
  showConfirmationModal = false;

  confirmationType: 'remove' | 'clear' | null = null;

  itemToRemove: CartItem | null = null;

  // ============================================
  // INITIALIZATION
  // ============================================

  ngOnInit(): void {

    this.subscribeToCartItems();

    this.subscribeToLoading();

    this.subscribeToError();

    this.subscribeToSubtotal();

    this.subscribeToCartCount();

    this.loadCart();

  }

  // ============================================
  // CART ITEMS
  // ============================================

  private subscribeToCartItems(): void {

    this.store.select(selectCartItems)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(items => {
        this.cartItems = items;
      });

  }

  // ============================================
  // LOADING STATE
  // ============================================

  private subscribeToLoading(): void {

    this.store.select(selectCartLoading)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(loading => {
        this.loading = loading;
      });

  }

  // ============================================
  // CART ERROR
  // ============================================

  private subscribeToError(): void {

    this.store.select(selectCartError)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(error => {
        this.error = error ?? '';
      });

  }

  // ============================================
  // SUBTOTAL
  // ============================================

  private subscribeToSubtotal(): void {

    this.store.select(selectCartSubtotal)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(subtotal => {
        this.subtotal = subtotal;
      });

  }

  // ============================================
  // TOTAL ITEMS
  // ============================================

  private subscribeToCartCount(): void {

    this.store.select(selectCartCount)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(count => {
        this.totalItems = count;
      });

  }

  // ============================================
  // LOAD CART
  // ============================================

  loadCart(): void {

    this.store.dispatch(loadCart());

  }

  // ============================================
  // CART PRODUCT COUNT
  // ============================================

  get cartProductCount(): number {

    return this.cartItems.length;

  }

  // ============================================
  // CHECK CART PRODUCT LIMIT
  // ============================================

  get isCartProductLimitReached(): boolean {

    return this.cartProductCount >= this.MAX_CART_PRODUCTS;

  }

  // ============================================
  // CHECK WHETHER PRODUCT CAN BE INCREASED
  // ============================================

  canIncreaseQuantity(item: CartItem): boolean {

    return (
      item.quantity < this.MAX_PRODUCT_QUANTITY &&
      item.quantity < item.product.stock
    );

  }

  // ============================================
  // INCREASE QUANTITY
  // ============================================

  increaseQuantity(item: CartItem): void {

    if (item.quantity >= this.MAX_PRODUCT_QUANTITY) {

      this.toastService.warning(
        `Maximum ${this.MAX_PRODUCT_QUANTITY} units allowed per product.`
      );

      return;

    }

    if (item.quantity >= item.product.stock) {

      this.toastService.warning(
        'Maximum available stock reached.'
      );

      return;

    }

    this.store.dispatch(
      updateCartQuantity({
        productId: item.product.id,
        quantity: item.quantity + 1
      })
    );

  }

  // ============================================
  // DECREASE QUANTITY
  // ============================================

  decreaseQuantity(item: CartItem): void {

    if (item.quantity <= 1) {
      return;
    }

    this.store.dispatch(
      updateCartQuantity({
        productId: item.product.id,
        quantity: item.quantity - 1
      })
    );

  }

  // ============================================
  // OPEN REMOVE CONFIRMATION
  // ============================================

  confirmRemoveItem(item: CartItem): void {

    this.itemToRemove = item;

    this.confirmationType = 'remove';

    this.showConfirmationModal = true;

  }

  // ============================================
  // OPEN CLEAR CART CONFIRMATION
  // ============================================

  confirmClearCart(): void {

    if (this.cartItems.length === 0) {
      return;
    }

    this.itemToRemove = null;

    this.confirmationType = 'clear';

    this.showConfirmationModal = true;

  }

  // ============================================
  // CANCEL CONFIRMATION
  // ============================================

  cancelConfirmation(): void {

    this.showConfirmationModal = false;

    this.confirmationType = null;

    this.itemToRemove = null;

  }

  // ============================================
  // CONFIRM ACTION
  // ============================================

  confirmAction(): void {

    if (this.confirmationType === 'remove') {

      this.confirmRemove();

    } else if (this.confirmationType === 'clear') {

      this.confirmClear();

    }

  }

  // ============================================
  // REMOVE ITEM FROM CART
  // ============================================

  private confirmRemove(): void {

    if (!this.itemToRemove) {
      return;
    }

    const productId = this.itemToRemove.product.id;

    // Listen for successful removal
    this.actions$
      .pipe(
        ofType(removeFromCartSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        this.toastService.success(
          'Product removed from cart successfully!'
        );

        this.cancelConfirmation();

      });

    // Listen for removal failure
    this.actions$
      .pipe(
        ofType(removeFromCartFailure),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        this.toastService.error(
          'Unable to remove product from cart.'
        );

        this.cancelConfirmation();

      });

    // Dispatch remove action
    this.store.dispatch(
      removeFromCart({
        productId
      })
    );

  }

  // ============================================
  // CLEAR CART
  // ============================================

  private confirmClear(): void {

    // Listen for successful clearing
    this.actions$
      .pipe(
        ofType(clearCartSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        this.toastService.success(
          'Cart cleared successfully!'
        );

        this.cancelConfirmation();

      });

    // Listen for clearing failure
    this.actions$
      .pipe(
        ofType(clearCartFailure),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        this.toastService.error(
          'Unable to clear cart. Please try again.'
        );

        this.cancelConfirmation();

      });

    // Dispatch clear action
    this.store.dispatch(clearCart());

  }

}