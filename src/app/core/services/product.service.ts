
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/products';

  // ============================================
  // GET ALL PRODUCTS
  // ============================================

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  // ============================================
  // GET PRODUCT BY ID
  // ============================================

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  // ============================================
  // SEARCH PRODUCTS
  // ============================================

  searchProducts(query: string): Observable<Product[]> {

    const searchTerm = query.trim();

    if (!searchTerm) {
      return this.getProducts();
    }

    return this.http.get<Product[]>(
      `${this.apiUrl}?q=${encodeURIComponent(searchTerm)}`
    );
  }

}
