
import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import { WishlistState } from './wishlist.reducer';

// Feature selector
export const selectWishlistState =
  createFeatureSelector<WishlistState>('wishlist');

// All wishlist products
export const selectWishlistProducts = createSelector(
  selectWishlistState,
  state => state.products
);

// Loading state
export const selectWishlistLoading = createSelector(
  selectWishlistState,
  state => state.loading
);

// Error state
export const selectWishlistError = createSelector(
  selectWishlistState,
  state => state.error
);

// Wishlist count
export const selectWishlistCount = createSelector(
  selectWishlistProducts,
  products => products.length
);

// Check whether a product is in wishlist
export const selectIsInWishlist = (productId: number) =>
  createSelector(
    selectWishlistProducts,
    products => products.some(product => product.id === productId)
  );
