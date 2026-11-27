
import {
  Component,
  inject,
  OnInit,
  DestroyRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { Store } from '@ngrx/store';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filter, take } from 'rxjs';

// ==================== PRODUCT MODEL ====================

import { Product } from '../../../../core/models/product.model';

// ==================== PRODUCTS STORE ====================

import {
  loadProducts
} from '../../../../store/products/products.actions';

import {
  selectAllProducts,
  selectProductsLoading,
  selectProductsError
} from '../../../../store/products/products.selectors';

// ==================== CART STORE ====================

import {
  addToCart
} from '../../../../store/cart/cart.actions';

import {
  selectCartItems
} from '../../../../store/cart/cart.selectors';

// ==================== WISHLIST STORE ====================

import {
  selectIsInWishlist
} from '../../../../store/wishlist/wishlist.selectors';

import {
  addToWishlist,
  removeFromWishlist
} from '../../../../store/wishlist/wishlist.actions';

// ==================== SERVICES ====================

import { AuthService } from '../../../../core/services/auth.service';

import { PendingActionService } from '../../../../core/services/pending-action.service';


@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})

export class ProductDetailsComponent implements OnInit {

  // ==================== INJECTIONS ====================

  private route = inject(ActivatedRoute);

  private router = inject(Router);

  private store = inject(Store);

  private destroyRef = inject(DestroyRef);

  private authService = inject(AuthService);

  private pendingActionService = inject(PendingActionService);


  // ==================== PRODUCT DATA ====================

  product: Product | null = null;

  similarProducts: Product[] = [];

  allProducts: Product[] = [];

  private currentProductId: number | null = null;


  // ==================== CART DATA ====================

  cartItems: { product: Product; quantity: number }[] = [];


  // ==================== QUANTITY ====================

  quantity = 1;


  // ==================== STATES ====================

  loading = true;

  error = '';

  private requestStarted = false;


  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  ngOnInit(): void {

    // ==================== LOAD PRODUCTS FROM STORE ====================

    this.store.select(selectAllProducts)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(products => {

        this.allProducts = products;

        if (products.length > 0) {

          this.updateCurrentProduct();

        } else if (!this.requestStarted) {

          this.requestStarted = true;

          this.store.dispatch(loadProducts());

        }

      });


    // ==================== WATCH ROUTE PARAMETER ====================

    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(params => {

        const id = Number(params.get('id'));

        if (!Number.isInteger(id) || id <= 0) {

          this.currentProductId = null;

          this.product = null;

          this.similarProducts = [];

          this.error = 'Invalid product ID.';

          this.loading = false;

          return;

        }


        // RESET PRODUCT STATE

        this.currentProductId = id;

        this.product = null;

        this.similarProducts = [];

        this.quantity = 1;

        this.error = '';

        this.loading = true;


        if (this.allProducts.length > 0) {

          this.updateCurrentProduct();

        }

      });


    // ==================== PRODUCTS LOADING STATE ====================

    this.store.select(selectProductsLoading)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(isLoading => {

        this.loading = isLoading;

        if (!isLoading && this.allProducts.length > 0) {

          this.updateCurrentProduct();

        }

      });


    // ==================== PRODUCTS ERROR STATE ====================

    this.store.select(selectProductsError)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(error => {

        if (error) {

          this.error = error;

          this.loading = false;

        }

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


  // ==========================================================
  // UPDATE CURRENT PRODUCT
  // ==========================================================

  private updateCurrentProduct(): void {

    if (this.currentProductId === null) {
      return;
    }

    const foundProduct = this.allProducts.find(
      product => product.id === this.currentProductId
    );


    if (foundProduct) {

      this.product = foundProduct;

      this.error = '';

      this.loading = false;

      this.loadSimilarProducts(foundProduct);

    } else {

      this.product = null;

      this.similarProducts = [];

      this.error = 'Product not found.';

      this.loading = false;

    }

  }


  // ==========================================================
  // SIMILAR PRODUCTS
  // ==========================================================

  loadSimilarProducts(currentProduct: Product): void {

    if (!this.allProducts.length) {

      this.similarProducts = [];

      return;

    }


    // EXCLUDE CURRENT PRODUCT

    const otherProducts = this.allProducts.filter(
      product => product.id !== currentProduct.id
    );


    // FIRST: SAME CATEGORY AND SAME BRAND

    const sameBrandAndCategory = otherProducts.filter(
      product =>
        product.category === currentProduct.category &&
        product.brand === currentProduct.brand
    );


    // SECOND: SAME CATEGORY

    const sameCategory = otherProducts.filter(
      product =>
        product.category === currentProduct.category &&
        product.brand !== currentProduct.brand
    );


    // THIRD: SAME BRAND

    const sameBrand = otherProducts.filter(
      product =>
        product.brand === currentProduct.brand &&
        product.category !== currentProduct.category
    );


    // COMBINE PRODUCTS IN PRIORITY ORDER

    const combinedProducts = [
      ...sameBrandAndCategory,
      ...sameCategory,
      ...sameBrand
    ];


    // REMOVE DUPLICATES

    const uniqueProducts = combinedProducts.filter(
      (product, index, self) =>
        index === self.findIndex(
          item => item.id === product.id
        )
    );


    // DISPLAY MAXIMUM 4 SIMILAR PRODUCTS

    this.similarProducts = uniqueProducts.slice(0, 4);

  }


  // ==========================================================
  // QUANTITY
  // ==========================================================

  increaseQuantity(): void {

    if (
      this.product &&
      this.quantity < this.product.stock
    ) {

      this.quantity++;

    }

  }


  decreaseQuantity(): void {

    if (this.quantity > 1) {

      this.quantity--;

    }

  }


  // ==========================================================
  // CHECK PRODUCT IN CART
  // ==========================================================

  isInCart(productId: number): boolean {

    return this.cartItems.some(
      item => item.product.id === productId
    );

  }


  // ==========================================================
  // ADD CURRENT PRODUCT TO CART / GO TO CART
  // ==========================================================

  addToCart(): void {

    if (!this.product || this.product.stock < 1) {
      return;
    }


    // ALREADY IN CART

    if (this.isInCart(this.product.id)) {

      this.router.navigate(['/cart']);

      return;

    }


    // LOGIN CHECK

    if (!this.authService.isLoggedIn()) {

      this.pendingActionService.saveAction({
        type: 'ADD_TO_CART',
        product: this.product,
        quantity: this.quantity
      });

      this.router.navigate(['/login']);

      return;

    }


    // ADD PRODUCT THROUGH NGRX

    this.store.dispatch(
      addToCart({
        product: this.product,
        quantity: this.quantity
      })
    );

  }


  // ==========================================================
  // BUY CURRENT PRODUCT
  // ==========================================================

  buyNow(): void {

    if (!this.product || this.product.stock < 1) {
      return;
    }


    // LOGIN CHECK

    if (!this.authService.isLoggedIn()) {

      this.pendingActionService.saveAction({
        type: 'BUY_NOW',
        product: this.product,
        quantity: this.quantity,
        route: '/checkout'
      });

      this.router.navigate(['/login']);

      return;

    }


    // DIRECT CHECKOUT WITHOUT ADDING TO CART

    this.router.navigate(['/checkout'], {
      queryParams: {
        productId: this.product.id,
        quantity:this.quantity
      }
    });

  }


  // ==========================================================
  // ADD SIMILAR PRODUCT TO CART / GO TO CART
  // ==========================================================

  addSimilarProductToCart(product: Product): void {

    if (!product || product.stock < 1) {
      return;
    }


    // ALREADY IN CART

    if (this.isInCart(product.id)) {

      this.router.navigate(['/cart']);

      return;

    }


    // LOGIN CHECK

    if (!this.authService.isLoggedIn()) {

      this.pendingActionService.saveAction({
        type: 'ADD_TO_CART',
        product,
        quantity: 1
      });

      this.router.navigate(['/login']);

      return;

    }


    // ADD SIMILAR PRODUCT THROUGH NGRX

    this.store.dispatch(
      addToCart({
        product,
        quantity: 1
      })
    );

  }


  // ==========================================================
  // BUY SIMILAR PRODUCT
  // ==========================================================

  buySimilarProductNow(product: Product): void {

    if (!product || product.stock < 1) {
      return;
    }


    // LOGIN CHECK

    if (!this.authService.isLoggedIn()) {

      this.pendingActionService.saveAction({
        type: 'BUY_NOW',
        product,
        quantity: 1,
        route: '/checkout'
      });

      this.router.navigate(['/login']);

      return;

    }


    // DIRECT CHECKOUT WITHOUT ADDING TO CART

    this.router.navigate(['/checkout'], {
      state: {
        buyNow: true,
        product,
        quantity: 1
      }
    });

  }


  // ==========================================================
  // WISHLIST
  // ==========================================================

  isInWishlist(productId: number) {

    return this.store.select(
      selectIsInWishlist(productId)
    );

  }


  // ==========================================================
  // TOGGLE WISHLIST
  // ==========================================================

  toggleWishlist(product: Product): void {

    // LOGIN CHECK

    if (!this.authService.isLoggedIn()) {

      this.pendingActionService.saveAction({
        type: 'ADD_TO_WISHLIST',
        product
      });

      this.router.navigate(['/login']);

      return;

    }


    // CHECK CURRENT WISHLIST STATE

    this.store.select(selectIsInWishlist(product.id))
      .pipe(
        take(1),
        filter(() => true),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(isInWishlist => {

        if (isInWishlist) {

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

      });

  }

}
