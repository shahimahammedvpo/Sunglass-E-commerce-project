
import {
  Component,
  Input,
  inject,
  OnInit,
  DestroyRef
} from '@angular/core';

import { CurrencyPipe } from '@angular/common';

import {
  Router,
  RouterLink
} from '@angular/router';

import { Store } from '@ngrx/store';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Product } from '../../../../core/models/product.model';

import { AuthService } from '../../../../core/services/auth.service';
import { PendingActionService } from '../../../../core/services/pending-action.service';

// ==================== WISHLIST ACTIONS ====================

import {
  addToWishlist,
  removeFromWishlist
} from '../../../../store/wishlist/wishlist.actions';

// ==================== WISHLIST SELECTORS ====================

import {
  selectWishlistProducts
} from '../../../../store/wishlist/wishlist.selectors';

// ==================== CART ACTIONS ====================

import {
  addToCart
} from '../../../../store/cart/cart.actions';

// ==================== CART SELECTORS ====================

import {
  selectCartItems
} from '../../../../store/cart/cart.selectors';


@Component({
  selector: 'app-trending-products',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink
  ],
  templateUrl: './trending-products.component.html',
  styleUrl: './trending-products.component.scss'
})

export class TrendingProductsComponent implements OnInit {

  @Input() products: Product[] = [];


  // ==================== INJECTIONS ====================

  private store = inject(Store);

  private destroyRef = inject(DestroyRef);

  private router = inject(Router);

  private authService = inject(AuthService);

  private pendingActionService = inject(PendingActionService);


  // ==================== DATA ====================

  wishlist: Product[] = [];

  cartItems: { product: Product; quantity: number }[] = [];


  // ==================== INITIALIZATION ====================

  ngOnInit(): void {

    // ==================== WISHLIST PRODUCTS ====================

    this.store.select(selectWishlistProducts)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(products => {

        this.wishlist = products;

      });


    // ==================== CART PRODUCTS ====================

    this.store.select(selectCartItems)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(items => {

        this.cartItems = items;

      });

  }


  // ==================== WISHLIST ====================

  toggleWishlist(product: Product): void {

    // CHECK LOGIN

    if (!this.authService.isLoggedIn()) {

      this.pendingActionService.saveAction({
        type: 'ADD_TO_WISHLIST',
        product
      });

      this.router.navigate(['/login']);

      return;

    }


    const alreadyInWishlist = this.isInWishlist(product.id);

    if (alreadyInWishlist) {

      this.store.dispatch(
        removeFromWishlist({
          productId: product.id
        })
      );

    } else {

      this.store.dispatch(
        addToWishlist({
          product
        })
      );

    }

  }


  // ==================== CHECK WISHLIST ====================

  isInWishlist(productId: number): boolean {

    // Always show an empty heart when logged out.

    if (!this.authService.isLoggedIn()) {
      return false;
    }

    return this.wishlist.some(
      product => product.id === productId
    );

  }


  // ==================== CHECK PRODUCT IN CART ====================

  isInCart(productId: number): boolean {

    return this.cartItems.some(
      item => item.product.id === productId
    );

  }


  // ==================== ADD TO CART / GO TO CART ====================

  addToCart(product: Product): void {

    // ALREADY IN CART: NAVIGATE TO CART

    if (this.isInCart(product.id)) {

      this.router.navigate(['/cart']);

      return;

    }


    // STOCK CHECK

    if (product.stock < 1) {
      return;
    }


    // CHECK LOGIN

    if (!this.authService.isLoggedIn()) {

      this.pendingActionService.saveAction({
        type: 'ADD_TO_CART',
        product,
        quantity: 1
      });

      this.router.navigate(['/login']);

      return;

    }


    // ADD TO CART THROUGH NGRX

    this.store.dispatch(
      addToCart({
        product,
        quantity: 1
      })
    );

  }


  // ==================== BUY NOW ====================

  buyNow(product: Product): void {

    if (!product || product.stock < 1) {
      return;
    }

    const quantity = 1;


    // CHECK LOGIN

    if (!this.authService.isLoggedIn()) {

      this.pendingActionService.saveAction({
        type: 'BUY_NOW',
        product,
        quantity
      });

      this.router.navigate(['/login']);

      return;

    }


    // DIRECT CHECKOUT WITHOUT ADDING TO CART

    this.router.navigate(['/checkout'], {
      queryParams: {
        productId: product.id,
        quantity
      }
    });

  }

}
