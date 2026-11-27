import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Coupon } from '../../../core/models/coupon.model';

@Injectable({
  providedIn: 'root'
})
export class AdminCouponsService {
  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/coupons';

  getCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.apiUrl);
  }

  addCoupon(coupon: Coupon): Observable<Coupon> {
    const { id, ...newCoupon } = coupon;
    return this.http.post<Coupon>(this.apiUrl, newCoupon);
  }

  updateCoupon(id: number, coupon: Partial<Coupon>): Observable<Coupon> {
    return this.http.patch<Coupon>(
      `${this.apiUrl}/${id}`,
      coupon
    );
  }

  deleteCoupon(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}