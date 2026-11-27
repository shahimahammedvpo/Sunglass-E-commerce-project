
import { CartItem } from '../services/cart.service';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;

}

export interface Order {
  id?: number;

  customerId: number;
  orderNumber?: number;
  customerName: string;
  email: string;

  items: CartItem[];

  shippingAddress: ShippingAddress;

  subtotal: number;
  shippingCharge: number;
  discount: number;
  totalAmount: number;

  couponCode: string;

  paymentMethod: string;
  status: string;

  createdAt: string;

    // Cancellation information
  cancellationReason?: string;

  cancellationComments?: string;

  cancelledAt?: string;
}
