
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Order } from '../../../core/models/order.model';

@Injectable({
  providedIn: 'root'
})
export class AdminOrdersService {
  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/orders';

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  updateOrderStatus(
    orderId: number,
    status: string
  ): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/${orderId}`,
      { status }
    );
  }
}
