export interface Address {
  id?: number;
  userId: number;

  fullName: string;
  phone: string;

  addressLine1: string;
  addressLine2?: string;

  city: string;
  state: string;
  postalCode: string;

  addressType: 'Home' | 'Work' | 'Other';

  isDefault: boolean;
}