import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Coupon } from '../models/coupon.model';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/coupons';

  getCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.apiUrl);
  }

  getCouponByCode(code: string): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.apiUrl, {
      params: { code }
    });
  }
}