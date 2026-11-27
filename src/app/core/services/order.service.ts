import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';

import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/orders';

  // ==========================================
  // Get next order number for a customer
  // ==========================================

  getNextOrderNumber(customerId: number): Observable<number> {

    return this.getOrdersByCustomer(customerId).pipe(

      map(orders => {

        if (orders.length === 0) {
          return 1;
        }

        const highestOrderNumber = Math.max(
          ...orders.map(order => order.orderNumber ?? 0)
        );

        return highestOrderNumber + 1;

      })

    );

  }


  // ==========================================
  // Create a new order
  // Automatically generates customer-specific
  // order number
  // ==========================================

  createOrder(order: Order): Observable<Order> {

    return this.getNextOrderNumber(order.customerId).pipe(

      switchMap(orderNumber => {

        const newOrder: Order = {
          ...order,
          orderNumber
        };

        return this.http.post<Order>(
          this.apiUrl,
          newOrder
        );

      })

    );

  }


  // ==========================================
  // Get orders belonging to a customer
  // ==========================================

  getOrdersByCustomer(customerId: number): Observable<Order[]> {

    return this.http.get<Order[]>(
      `${this.apiUrl}?customerId=${customerId}`
    );

  }


  // ==========================================
  // Get order by database ID
  // ==========================================

  getOrderById(id: number): Observable<Order> {

    return this.http.get<Order>(
      `${this.apiUrl}/${id}`
    );

  }


  // ==========================================
  // Get all orders
  // ==========================================

  getOrders(): Observable<Order[]> {

    return this.http.get<Order[]>(
      this.apiUrl
    );

  }


  // ==========================================
  // Update an existing order
  // ==========================================

  updateOrder(id: number, order: Order): Observable<Order> {

    return this.http.patch<Order>(
      `${this.apiUrl}/${id}`,
      order
    );

  }


  // ==========================================
  // Cancel an order
  // Saves cancellation reason and comments
  // ==========================================

  cancelOrder(
    orderId: number,
    cancellationReason?: string,
    cancellationComments?: string
  ): Observable<Order> {

    const cancellationData = {

      status: 'Cancelled',

      cancellationReason:
        cancellationReason || '',

      cancellationComments:
        cancellationComments || '',

      cancelledAt:
        new Date().toISOString()

    };

    return this.http.patch<Order>(
      `${this.apiUrl}/${orderId}`,
      cancellationData
    );

  }

}