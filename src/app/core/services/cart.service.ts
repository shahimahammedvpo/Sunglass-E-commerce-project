
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  Observable,
  map,
  tap,
  switchMap
} from 'rxjs';

import { Product } from '../models/product.model';

// ============================================
// CART INTERFACES
// ============================================

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartRecord {
  id?: number;
  userId: number;
  items: CartItem[];
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/carts';

  private cartRecord: CartRecord | null = null;

  private currentUserId: number | null = null;

  // ============================================
  // LOAD CART
  // ============================================

  loadCart(userId: number): Observable<CartItem[]> {

    if (this.currentUserId !== userId) {
      this.cartRecord = null;
      this.currentUserId = userId;
    }

    return this.http.get<CartRecord[]>(
      `${this.apiUrl}?userId=${userId}`
    ).pipe(

      map(records => records[0] ?? {
        userId,
        items: []
      }),

      tap(record => {
        this.cartRecord = record;
      }),

      map(record => record.items ?? [])

    );

  }

  // ============================================
  // SAVE CART
  // ============================================

  saveCart(
    userId: number,
    items: CartItem[]
  ): Observable<CartItem[]> {

    if (this.currentUserId !== userId) {
      this.cartRecord = null;
      this.currentUserId = userId;
    }

    const cartData: CartRecord = {
      userId,
      items
    };

    // Update existing cart record
    if (this.cartRecord?.id) {

      return this.http.patch<CartRecord>(
        `${this.apiUrl}/${this.cartRecord.id}`,
        { items }
      ).pipe(

        tap(savedRecord => {
          this.cartRecord = savedRecord;
        }),

        map(() => items)

      );

    }

    // Check whether a cart record already exists
    return this.http.get<CartRecord[]>(
      `${this.apiUrl}?userId=${userId}`
    ).pipe(

      switchMap(records => {

        const existingRecord = records[0];

        if (existingRecord?.id) {

          return this.http.patch<CartRecord>(
            `${this.apiUrl}/${existingRecord.id}`,
            { items }
          );

        }

        return this.http.post<CartRecord>(
          this.apiUrl,
          cartData
        );

      }),

      tap(savedRecord => {
        this.cartRecord = savedRecord;
      }),

      map(() => items)

    );

  }

}
