
export interface Product {
  id: number;
  name: string;
  brand: string; 
  category: 'Men' | 'Women' | 'Unisex';
  description: string;

  price: number;
  originalPrice: number;

  rating: number;
  reviewCount: number;
  discount: number;

  stock: number;
  image: string;

  features: string[];
  tags: string[];

  isFeatured: boolean;
}
