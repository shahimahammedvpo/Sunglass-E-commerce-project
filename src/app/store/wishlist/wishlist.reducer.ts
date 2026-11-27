
import { createReducer, on } from '@ngrx/store';
import { Product } from '../../core/models/product.model';

import {
  loadWishlist,
  loadWishlistSuccess,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  
  
} from './wishlist.actions';

import {
  addToWishlistSuccess,
  addToWishlistFailure,
  removeFromWishlistSuccess,
  removeFromWishlistFailure,
  clearWishlistSuccess,
  clearWishlistFailure
} from './wishlist.actions';

export interface WishlistState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

export const initialWishlistState: WishlistState = {
  products: [],
  loading: false,
  error: null
};

export const wishlistReducer = createReducer(
  initialWishlistState,

  on(loadWishlist, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(loadWishlistSuccess, (state, { products }) => ({
    ...state,
    products,
    loading: false,
    error: null
  })),

  on(
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    state => ({
      ...state,
      loading: true,
      error: null
    })
  ),

  on(
  addToWishlistSuccess,
  removeFromWishlistSuccess,
  clearWishlistSuccess,
  (state, { products }) => ({
    ...state,
    products,
    loading: false,
    error: null
  })
),

 on(
  
  addToWishlistFailure,
  removeFromWishlistFailure,
  clearWishlistFailure,
  (state, { error }) => ({
    ...state,
    loading: false,
    error
  })
)
);
