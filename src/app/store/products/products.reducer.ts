
import { createReducer, on } from '@ngrx/store';

import { Product } from '../../core/models/product.model';

import {
  loadProducts,
  loadProductsSuccess,
  loadProductsFailure
} from './products.actions';

export interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

export const initialProductsState: ProductsState = {
  products: [],
  loading: false,
  error: null
};

export const productsReducer = createReducer(

  initialProductsState,

  // Loading started
  on(loadProducts, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  // Products loaded successfully
  on(loadProductsSuccess, (state, { products }) => ({
    ...state,
    products,
    loading: false,
    error: null
  })),

  // Product loading failed
  on(loadProductsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))

);
