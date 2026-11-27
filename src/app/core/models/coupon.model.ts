export type CouponDiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id?: number;
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  isActive: boolean;
  expiryDate: string;
}