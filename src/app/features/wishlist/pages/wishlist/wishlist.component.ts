import {
  Component,
  inject,
  OnInit,
  DestroyRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  Router,
  RouterLink
} from '@angular/router';

import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';

import {
  take,
  filter
} from 'rxjs';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Product } from '../../../../core/models/product.model';
import { ToastService } from '../../../../core/services/toast.service';

// Wishlist Actions
import {
  removeFromWishlist,
  removeFromWishlistSuccess,
  removeFromWishlistFailure,

  clearWishlist,
  clearWishlistSuccess,
  clearWishlistFailure
} from '../../../../store/wishlist/wishlist.actions';

// Wishlist Selectors
import {
  selectWishlistProducts,
  selectWishlistLoading,
  selectWishlistError
} from '../../../../store/wishlist/wishlist.selectors';

// Cart Actions
import {
  addToCart,
  addToCartSuccess,
  addToCartFailure,
} from '../../../../store/cart/cart.actions';


@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss'
})
export class WishlistComponent implements OnInit {

  // ============================================
  // INJECTIONS
  // ============================================

  private store = inject(Store);

  private actions$ = inject(Actions);

  private destroyRef = inject(DestroyRef);

  private router = inject(Router);

  private toastService = inject(ToastService);


  // ============================================
  // DATA
  // ============================================

  wishlist: Product[] = [];


  // ============================================
  // STATE
  // ============================================

  loading = true;

  error = '';


  // ============================================
  // CONFIRMATION MODAL
  // ============================================

  showConfirmationModal = false;

  confirmationType: 'remove' | 'clear' | null = null;

  productToRemove: Product | null = null;


  // ============================================
  // INITIALIZATION
  // ============================================

  ngOnInit(): void {

    // ============================================
    // WISHLIST PRODUCTS
    // ============================================

    this.store.select(selectWishlistProducts)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(products => {
        this.wishlist = products;
      });


    // ============================================
    // LOADING STATE
    // ============================================

    this.store.select(selectWishlistLoading)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(loading => {
        this.loading = loading;
      });


    // ============================================
    // ERROR STATE
    // ============================================

    this.store.select(selectWishlistError)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(error => {
        this.error = error ?? '';
      });

  }


  // ============================================
  // OPEN REMOVE CONFIRMATION
  // ============================================

  confirmRemoveProduct(product: Product): void {

    this.productToRemove = product;

    this.confirmationType = 'remove';

    this.showConfirmationModal = true;

  }


  // ============================================
  // OPEN CLEAR WISHLIST CONFIRMATION
  // ============================================

  confirmClearWishlist(): void {

    if (this.wishlist.length === 0) {
      return;
    }

    this.productToRemove = null;

    this.confirmationType = 'clear';

    this.showConfirmationModal = true;

  }


  // ============================================
  // CANCEL CONFIRMATION
  // ============================================

  cancelConfirmation(): void {

    this.showConfirmationModal = false;

    this.confirmationType = null;

    this.productToRemove = null;

  }


  // ============================================
  // CONFIRM ACTION
  // ============================================

  confirmAction(): void {

    if (this.confirmationType === 'remove') {

      this.confirmRemoveProductAction();

    } else if (this.confirmationType === 'clear') {

      this.confirmClearWishlistAction();

    }

  }
  // ============================================
  // REMOVE PRODUCT FROM WISHLIST
  // ============================================

  private confirmRemoveProductAction(): void {

    if (!this.productToRemove) {
      return;
    }

    const productId = this.productToRemove.id;
    // ============================================
    // LISTEN FOR REMOVE SUCCESS
    // ============================================
    this.actions$
      .pipe(
        ofType(removeFromWishlistSuccess),

        take(1),

        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        // Close confirmation modal
        this.cancelConfirmation();

      });


    // ============================================
    // LISTEN FOR REMOVE FAILURE
    // ============================================

    this.actions$
      .pipe(
        ofType(removeFromWishlistFailure),

        filter(action =>
          action.productId === productId
        ),

        take(1),

        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        // Error toast is handled by WishlistEffects
        this.cancelConfirmation();

      });


    // ============================================
    // DISPATCH REMOVE ACTION
    // ============================================

    this.store.dispatch(
      removeFromWishlist({
        productId
      })
    );

  }




  // ============================================
  // MOVE TO CART
  // ============================================

  moveToCart(product: Product): void {

  // ============================================
  // STOCK VALIDATION
  // ============================================

  if (product.stock < 1) {

    this.toastService.warning(
      'This product is currently out of stock.'
    );

    return;

  }


  // ============================================
  // DISPATCH ADD TO CART
  // ============================================

  this.store.dispatch(
    addToCart({
      product,
      quantity: 1
    })
  );

}


  // ============================================
  // REMOVE PRODUCT AFTER ADDING TO CART
  // ============================================

  


  // ============================================
  // BUY NOW
  // ============================================

  buyNow(product: Product): void {

    // ============================================
    // STOCK VALIDATION
    // ============================================

    if (product.stock < 1) {

      this.toastService.warning(
        'This product is currently out of stock.'
      );

      return;

    }
       this.router.navigate(['/checkout'], {
      queryParams: {
        productId: product.id,
        
      }
    });


    // ============================================
    // LISTEN FOR CART OPERATION
    // ============================================

    this.actions$
      .pipe(
        ofType(
          addToCartSuccess,
          addToCartFailure
        ),

        filter(action =>
          action.productId === product.id
        ),

        take(1),

        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(action => {

        // ============================================
        // SUCCESS
        // ============================================

        if (action.type === addToCartSuccess.type) {

          // Success toast is handled by CartEffects

          this.router.navigate(['/checkout']);

        }


        // ============================================
        // FAILURE
        // ============================================

        // Failure toast is handled by CartEffects

      });


    // ============================================
    // DISPATCH ADD TO CART
    // ============================================

    this.store.dispatch(
      addToCart({
        product,
        quantity: 1
      })
    );

  }


  // ============================================
  // CLEAR WISHLIST
  // ============================================

  private confirmClearWishlistAction(): void {


    // ============================================
    // LISTEN FOR CLEAR SUCCESS
    // ============================================

    this.actions$
      .pipe(
        ofType(clearWishlistSuccess),

        take(1),

        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        // Close confirmation modal
        // Success toast is handled by WishlistEffects

        this.cancelConfirmation();

      });


    // ============================================
    // LISTEN FOR CLEAR FAILURE
    // ============================================

    this.actions$
      .pipe(
        ofType(clearWishlistFailure),

        take(1),

        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        // Close confirmation modal
        // Error toast is handled by WishlistEffects

        this.cancelConfirmation();

      });


    // ============================================
    // DISPATCH CLEAR WISHLIST
    // ============================================

    this.store.dispatch(
      clearWishlist()
    );

  }

}