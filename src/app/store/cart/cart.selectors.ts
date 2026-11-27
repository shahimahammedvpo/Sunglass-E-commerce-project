
import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import { CartState } from './cart.state';

// ============================================
// FEATURE SELECTOR
// ============================================

export const selectCartState =
  createFeatureSelector<CartState>('cart');

// ============================================
// CART ITEMS
// ============================================

export const selectCartItems = createSelector(
  selectCartState,
  state => state.items
);

// ============================================
// LOADING STATE
// ============================================

export const selectCartLoading = createSelector(
  selectCartState,
  state => state.loading
);

// ============================================
// ERROR STATE
// ============================================

export const selectCartError = createSelector(
  selectCartState,
  state => state.error
);

// ============================================
// CART COUNT
// ============================================

export const selectCartCount = createSelector(
  selectCartItems,
  items => items.reduce(
    (total, item) => total + item.quantity,
    0
  )
);

// ============================================
// CART SUBTOTAL
// ============================================

export const selectCartSubtotal = createSelector(
  selectCartItems,
  items => items.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0
  )
);

// ============================================
// CART TOTAL
// ============================================

export const selectCartTotal = createSelector(
  selectCartSubtotal,
  subtotal => subtotal
);

// ============================================
// CHECK EMPTY CART
// ============================================

export const selectIsCartEmpty = createSelector(
  selectCartItems,
  items => items.length === 0
);
