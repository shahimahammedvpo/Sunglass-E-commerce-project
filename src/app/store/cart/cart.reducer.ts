
import { createReducer, on } from '@ngrx/store';

import {
  CartState,
  initialCartState
} from './cart.state';

import {
  loadCart,
  loadCartSuccess,
  loadCartFailure,

  addToCart,
  addToCartSuccess,
  addToCartFailure,

  updateCartQuantity,
  updateCartQuantitySuccess,
  updateCartQuantityFailure,

  removeFromCart,
  removeFromCartSuccess,
  removeFromCartFailure,

  clearCart,
  clearCartSuccess,
  clearCartFailure
} from './cart.actions';

import { logoutSuccess } from '../auth/auth.actions';

export const cartReducer = createReducer(

  initialCartState,

  // ============================================
  // LOAD CART
  // ============================================

  on(loadCart, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(loadCartSuccess, (state, { items }) => ({
    ...state,
    items,
    loading: false,
    error: null
  })),

  on(loadCartFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // ============================================
  // ADD TO CART
  // ============================================

  on(addToCart, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(addToCartSuccess, (state, { items }) => ({
    ...state,
    items,
    loading: false,
    error: null
  })),

  on(addToCartFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // ============================================
  // UPDATE QUANTITY
  // ============================================

  on(updateCartQuantity, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(updateCartQuantitySuccess, (state, { items }) => ({
    ...state,
    items,
    loading: false,
    error: null
  })),

  on(updateCartQuantityFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // ============================================
  // REMOVE FROM CART
  // ============================================

  on(removeFromCart, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(removeFromCartSuccess, (state, { items }) => ({
    ...state,
    items,
    loading: false,
    error: null
  })),

  on(removeFromCartFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // ============================================
  // CLEAR CART
  // ============================================

  on(clearCart, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(clearCartSuccess, (state, { items }) => ({
    ...state,
    items,
    loading: false,
    error: null
  })),

  on(clearCartFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  on(
  logoutSuccess,
  () => ({
    ...initialCartState
  })
)

);
