
import { createFeatureSelector, createSelector } from '@ngrx/store';

import { ProductsState } from './products.reducer';

// Access the Products feature state
export const selectProductsState =
  createFeatureSelector<ProductsState>('products');

// Get all products
export const selectAllProducts = createSelector(
  selectProductsState,
  state => state.products
);

// Get loading status
export const selectProductsLoading = createSelector(
  selectProductsState,
  state => state.loading
);

// Get error message
export const selectProductsError = createSelector(
  selectProductsState,
  state => state.error
);


// Get a product by ID
export const selectProductById = (id: number) =>
  createSelector(
    selectAllProducts,
    products => products.find(product => product.id === id) ?? null
  );