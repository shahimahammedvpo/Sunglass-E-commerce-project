import { createAction, props } from '@ngrx/store';
import { Product } from '../../core/models/product.model';

// ==================== LOAD WISHLIST ====================

export const loadWishlist = createAction(
  '[Wishlist] Load Wishlist'
);

export const loadWishlistSuccess = createAction(
  '[Wishlist] Load Wishlist Success',
  props<{ products: Product[] }>()
);

// ==================== ADD PRODUCT ====================

export const addToWishlist = createAction(
  '[Wishlist] Add To Wishlist',
  props<{ product: Product }>()
);

export const addToWishlistSuccess = createAction(
  '[Wishlist] Add To Wishlist Success',
  props<{ products: Product[] }>()
);

export const addToWishlistFailure = createAction(
  '[Wishlist] Add To Wishlist Failure',
  props<{ error: string }>()
);

// ==================== REMOVE PRODUCT ====================

export const removeFromWishlist = createAction(
  '[Wishlist] Remove From Wishlist',
  props<{ productId: number }>()
);

export const removeFromWishlistSuccess = createAction(
  '[Wishlist] Remove From Wishlist Success',
  props<{ products: Product[] }>()
);

export const removeFromWishlistFailure = createAction(
  '[Wishlist] Remove From Wishlist Failure',
  props<{
    productId: number;
    error: string;
  }>()
);

// ==================== CLEAR WISHLIST ====================

export const clearWishlist = createAction(
  '[Wishlist] Clear Wishlist'
);

export const clearWishlistSuccess = createAction(
  '[Wishlist] Clear Wishlist Success',
  props<{ products: Product[] }>()
);

export const clearWishlistFailure = createAction(
  '[Wishlist] Clear Wishlist Failure',
  props<{ error: string }>()
);

// ==================== GENERAL OPERATIONS ====================



export const wishlistFailure = createAction(
  '[Wishlist] Failure',
  props<{ error: string }>()
);