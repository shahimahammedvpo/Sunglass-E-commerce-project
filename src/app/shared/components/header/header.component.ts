
import {
  Component,
  inject,
  OnInit,
  HostListener,
  DestroyRef
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive,
  Router
} from '@angular/router';

import {
  FormsModule,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';

import {
  AsyncPipe,
  CurrencyPipe
} from '@angular/common';

import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  startWith,
  catchError,
  of,
  take
} from 'rxjs';

import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Models
import { Product } from '../../../core/models/product.model';
import { AuthUser } from '../../../core/models/user.model';

// Services
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { PendingActionService } from '../../../core/services/pending-action.service';

// Auth Store
import {
  logout,
  logoutSuccess
} from '../../../store/auth/auth.actions';

import {
  selectCurrentUser,
  selectIsAuthenticated
} from '../../../store/auth/auth.selectors';

// Cart Store
import { loadCart } from '../../../store/cart/cart.actions';
import { selectCartCount } from '../../../store/cart/cart.selectors';

// Wishlist Store
import { loadWishlist } from '../../../store/wishlist/wishlist.actions';
import { selectWishlistCount } from '../../../store/wishlist/wishlist.selectors';

@Component({
  selector: 'app-header',
  standalone: true,

  imports: [
    RouterLink,
    RouterLinkActive,
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe,
    CurrencyPipe
  ],

  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  private router = inject(Router);
  private store = inject(Store);
  private actions$ = inject(Actions);
  private destroyRef = inject(DestroyRef);

  private productService = inject(ProductService);
  private toastService = inject(ToastService);
  private pendingActionService = inject(PendingActionService);

  // ============================================
  // SEARCH
  // ============================================

  searchText = '';

  searchControl = new FormControl('', {
    nonNullable: true
  });

  showSearchSuggestions = false;

  searchResults$ = this.searchControl.valueChanges.pipe(

    startWith(''),

    debounceTime(300),

    distinctUntilChanged(),

    switchMap(query => {

      const search = query.trim();

      if (search.length < 2) {
        return of([]);
      }

      return this.productService.searchProducts(search).pipe(

        catchError(error => {

          console.error('Search error:', error);

          return of([]);

        })

      );

    })

  );

  // ============================================
  // LOGOUT MODAL
  // ============================================

  showLogoutModal = false;

  // ============================================
  // AUTHENTICATION STATE
  // ============================================

  currentUser: AuthUser | null = null;

  isLoggedIn = false;

  // ============================================
  // CART COUNT
  // ============================================

  readonly cartCount$ = this.store.select(selectCartCount);

  // ============================================
  // WISHLIST COUNT
  // ============================================

  readonly wishlistCount$ = this.store.select(selectWishlistCount);

  // Prevent duplicate initial cart/wishlist loading
  private lastLoadedUserId: number | null = null;

  // ============================================
  // INITIALIZATION
  // ============================================

  ngOnInit(): void {

    this.subscribeToCurrentUser();

    this.subscribeToAuthentication();

  }

  // ============================================
  // CURRENT USER
  // ============================================

  private subscribeToCurrentUser(): void {

    this.store.select(selectCurrentUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {

        this.currentUser = user;

        if (user) {

          if (this.lastLoadedUserId !== user.id) {

            this.lastLoadedUserId = user.id;

            this.loadUserData();

          }

        } else {

          this.lastLoadedUserId = null;

        }

      });

  }

  // ============================================
  // AUTHENTICATION STATUS
  // ============================================

  private subscribeToAuthentication(): void {

    this.store.select(selectIsAuthenticated)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => {

        this.isLoggedIn = status;

      });

  }

  // ============================================
  // LOAD USER DATA
  // ============================================

  private loadUserData(): void {

    this.store.dispatch(loadCart());

    this.store.dispatch(loadWishlist());

  }

  // ============================================
  // SEARCH PRODUCTS
  // ============================================

  onSearch(): void {

    const query = this.searchControl.value.trim();

    if (!query) {

      this.closeSearchSuggestions();

      return;

    }

    this.closeSearchSuggestions();

    this.router.navigate(['/products'], {

      queryParams: {
        search: query
      }

    });

  }

  // ============================================
  // SELECT PRODUCT FROM SUGGESTIONS
  // ============================================

  selectProduct(product: Product): void {

    this.searchControl.setValue('');

    this.closeSearchSuggestions();

    this.router.navigate(['/product', product.id]);

  }

  // ============================================
  // SEARCH SUGGESTIONS
  // ============================================

  onSearchFocus(): void {

    this.showSearchSuggestions = true;

  }

  closeSearchSuggestions(): void {

    this.showSearchSuggestions = false;

  }

  @HostListener('document:click')
  onDocumentClick(): void {

    this.closeSearchSuggestions();

  }

  // ============================================
  // LOGOUT
  // ============================================

  logout(): void {

    this.showLogoutModal = true;

  }

  cancelLogout(): void {

    this.showLogoutModal = false;

  }

  confirmLogout(): void {

    this.showLogoutModal = false;

    // Listen for successful logout
    this.actions$
      .pipe(
        ofType(logoutSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        this.toastService.success(
          'Logged out successfully!'
        );

        this.router.navigate(['/login']);

      });

    // Dispatch logout action
    this.store.dispatch(logout());

  }

  // ============================================
  // CART NAVIGATION
  // ============================================

  navigateToCart(): void {

    if (!this.isLoggedIn) {

      this.pendingActionService.saveAction({

        type: 'NAVIGATE',

        route: '/cart'

      });

      this.router.navigate(['/login']);

      return;

    }

    this.router.navigate(['/cart']);

  }

  // ============================================
  // WISHLIST NAVIGATION
  // ============================================

  navigateToWishlist(): void {

    if (!this.isLoggedIn) {

      this.pendingActionService.saveAction({

        type: 'NAVIGATE',

        route: '/wishlist'

      });

      this.router.navigate(['/login']);

      return;

    }

    this.router.navigate(['/wishlist']);

  }

}
