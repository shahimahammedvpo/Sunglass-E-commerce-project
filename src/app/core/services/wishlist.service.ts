
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  Observable,
  of,
  map,
  switchMap,
  tap
} from 'rxjs';

import { Product } from '../models/product.model';

// ============================================
// WISHLIST RECORD
// ============================================

interface WishlistRecord {
  id?: number;
  userId: number;
  products: Product[];
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/wishlists';

  private wishlistRecord: WishlistRecord | null = null;

  private currentUserId: number | null = null;

  // ============================================
  // LOAD WISHLIST
  // ============================================

  loadWishlist(userId: number): Observable<Product[]> {

    // Reset cached record when the user changes
    if (this.currentUserId !== userId) {
      this.wishlistRecord = null;
      this.currentUserId = userId;
    }

    return this.http.get<WishlistRecord[]>(
      `${this.apiUrl}?userId=${userId}`
    ).pipe(

      map(records => records[0] ?? {
        userId,
        products: []
      }),

      tap(record => {
        this.wishlistRecord = record;
      }),

      map(record => record.products ?? [])

    );

  }

  // ============================================
  // SAVE WISHLIST
  // ============================================

  saveWishlist(
    userId: number,
    products: Product[]
  ): Observable<Product[]> {

    // Ensure the cached record belongs to this user
    if (this.currentUserId !== userId) {
      this.wishlistRecord = null;
      this.currentUserId = userId;
    }

    const wishlistData: WishlistRecord = {
      userId,
      products
    };

    // Update existing record
    if (this.wishlistRecord?.id) {

      return this.http.patch<WishlistRecord>(
        `${this.apiUrl}/${this.wishlistRecord.id}`,
        { products }
      ).pipe(

        tap(savedRecord => {
          this.wishlistRecord = savedRecord;
        }),

        map(() => products)

      );

    }

    // No cached record: check whether one already exists
    return this.http.get<WishlistRecord[]>(
      `${this.apiUrl}?userId=${userId}`
    ).pipe(

      switchMap(records => {

        const existingRecord = records[0];

        if (existingRecord?.id) {

          return this.http.patch<WishlistRecord>(
            `${this.apiUrl}/${existingRecord.id}`,
            { products }
          );

        }

        return this.http.post<WishlistRecord>(
          this.apiUrl,
          wishlistData
        );

      }),

      tap(savedRecord => {
        this.wishlistRecord = savedRecord;
      }),

      map(() => products)

    );

  }

}
