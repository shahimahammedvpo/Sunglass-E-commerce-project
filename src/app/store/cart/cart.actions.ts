import { createAction, props } from '@ngrx/store';
import { CartItem } from '../../core/services/cart.service';
import { Product } from '../../core/models/product.model';

// ==================== LOAD CART ====================

export const loadCart = createAction(
  '[Cart] Load Cart'
);

export const loadCartSuccess = createAction(
  '[Cart] Load Cart Success',
  props<{ items: CartItem[] }>()
);

export const loadCartFailure = createAction(
  '[Cart] Load Cart Failure',
  props<{ error: string }>()
);

// ==================== ADD TO CART ====================

export const addToCart = createAction(
  '[Cart] Add To Cart',
  props<{
    product: Product;
    quantity: number;
    showToast?: boolean;
  }>()
);

export const addToCartSuccess = createAction(
  '[Cart] Add To Cart Success',
  props<{
    items: CartItem[];
    productId: number;
    showToast?: boolean;
  }>()
);

export const addToCartFailure = createAction(
  '[Cart] Add To Cart Failure',
  props<{
    error: string;
    productId: number;
  }>()
);

// ==================== UPDATE QUANTITY ====================

export const updateCartQuantity = createAction(
  '[Cart] Update Quantity',
  props<{
    productId: number;
    quantity: number;
  }>()
);

export const updateCartQuantitySuccess = createAction(
  '[Cart] Update Quantity Success',
  props<{ items: CartItem[] }>()
);

export const updateCartQuantityFailure = createAction(
  '[Cart] Update Quantity Failure',
  props<{ error: string }>()
);

// ==================== REMOVE FROM CART ====================

export const removeFromCart = createAction(
  '[Cart] Remove From Cart',
  props<{ productId: number }>()
);

export const removeFromCartSuccess = createAction(
  '[Cart] Remove From Cart Success',
  props<{ items: CartItem[] }>()
);

export const removeFromCartFailure = createAction(
  '[Cart] Remove From Cart Failure',
  props<{ error: string }>()
);

// ==================== CLEAR CART ====================

export const clearCart = createAction(
  '[Cart] Clear Cart'
);

export const clearCartSuccess = createAction(
  '[Cart] Clear Cart Success',
  props<{ items: CartItem[] }>()
);

export const clearCartFailure = createAction(
  '[Cart] Clear Cart Failure',
  props<{ error: string }>()
);