
import { createAction, props } from '@ngrx/store';

import { Product } from '../../core/models/product.model';

// Request to load products
export const loadProducts = createAction(
  '[Products] Load Products'
);

// Successfully loaded products
export const loadProductsSuccess = createAction(
  '[Products] Load Products Success',
  props<{ products: Product[] }>()
);

// Failed to load products
export const loadProductsFailure = createAction(
  '[Products] Load Products Failure',
  props<{ error: string }>()
);
