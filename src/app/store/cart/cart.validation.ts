
import { Product } from '../../core/models/product.model';
import { CartItem } from '../../core/services/cart.service';

export const MAX_CART_PRODUCTS = 10;
export const MAX_PRODUCT_QUANTITY = 5;

// ============================================
// VALIDATE ADD TO CART
// ============================================

export function validateAddToCart(
  product: Product,
  quantity: number,
  cart: CartItem[]
): string | null {

  if (!Number.isInteger(quantity) || quantity < 1) {
    return 'Please select a valid quantity.';
  }

  if (product.stock < 1) {
    return 'This product is currently out of stock.';
  }

  if (quantity > MAX_PRODUCT_QUANTITY) {
    return `You can add a maximum of ${MAX_PRODUCT_QUANTITY} quantities of this product.`;
  }

  if (quantity > product.stock) {
    return 'Available stock limit reached for this product.';
  }

  const existingItem = cart.find(
    item => item.product.id === product.id
  );

  if (existingItem) {

    const newQuantity = existingItem.quantity + quantity;

    if (newQuantity > MAX_PRODUCT_QUANTITY) {
      return `You can add a maximum of ${MAX_PRODUCT_QUANTITY} quantities of this product.`;
    }

    if (newQuantity > product.stock) {
      return 'Available stock limit reached for this product.';
    }

  } else if (cart.length >= MAX_CART_PRODUCTS) {

    return `Your cart can contain a maximum of ${MAX_CART_PRODUCTS} different products.`;

  }

  return null;
}

// ============================================
// VALIDATE UPDATE QUANTITY
// ============================================

export function validateCartQuantity(
  product: Product,
  quantity: number
): string | null {

  if (!Number.isInteger(quantity) || quantity < 1) {
    return 'Please select a valid quantity.';
  }

  if (quantity > MAX_PRODUCT_QUANTITY) {
    return `You can add a maximum of ${MAX_PRODUCT_QUANTITY} quantities of this product.`;
  }

  if (quantity > product.stock) {
    return 'Available stock limit reached for this product.';
  }

  return null;
}
