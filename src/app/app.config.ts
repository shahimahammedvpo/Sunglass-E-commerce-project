import {
  ApplicationConfig,
  APP_INITIALIZER
} from '@angular/core';

import {
  provideRouter,
  withInMemoryScrolling
} from '@angular/router';

import { provideHttpClient } from '@angular/common/http';

import { Store } from '@ngrx/store';

import {
  firstValueFrom,
  filter,
  take
} from 'rxjs';

// NgRx
import { provideStore, provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

// Routes
import { routes } from './app.routes';

// Products Store
import { productsReducer } from './store/products/products.reducer';
import { ProductsEffects } from './store/products/products.effects';

// Cart Store
import { cartReducer } from './store/cart/cart.reducer';
import { CartEffects } from './store/cart/cart.effects';

// Wishlist Store
import { wishlistReducer } from './store/wishlist/wishlist.reducer';
import { WishlistEffects } from './store/wishlist/wishlist.effects';

// Auth Store
import { authReducer } from './store/auth/auth.reducer';
import { AuthEffects } from './store/auth/auth.effects';

// Auth Actions
import { restoreSession } from './store/auth/auth.actions';

// Auth Selectors
import { selectAuthLoading } from './store/auth/auth.selectors';

// ============================================
// RESTORE AUTH SESSION
// ============================================

export function initializeAuth(store: Store) {

  return () => {

    // Dispatch session restoration
    store.dispatch(restoreSession());

    // Wait until restoration completes
    return firstValueFrom(
      store.select(selectAuthLoading).pipe(
        filter(loading => !loading),
        take(1)
      )
    );

  };

}

// ============================================
// APPLICATION CONFIGURATION
// ============================================

export const appConfig: ApplicationConfig = {

  providers: [

    // Router
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled'
      })
    ),

    // HTTP
    provideHttpClient(),

    // Root Store
    provideStore(),

    // Feature Stores
    provideState('products', productsReducer),
    provideState('cart', cartReducer),
    provideState('wishlist', wishlistReducer),
    provideState('auth', authReducer),

    // Effects
    provideEffects(
      ProductsEffects,
      CartEffects,
      WishlistEffects,
      AuthEffects
    ),

    // Authentication initialization
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [Store],
      multi: true
    }

  ]

};