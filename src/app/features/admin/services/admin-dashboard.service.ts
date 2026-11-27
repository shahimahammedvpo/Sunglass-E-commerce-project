
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';

export interface AdminDashboardUser {
  id: number;
  fullName: string;
  email: string;
  role?: string;
  isBlocked?: boolean;
}

export interface AdminDashboardProduct {
  id: number;
  name: string;
  brand?: string;
  category?: string;
  price: number;
  stock?: number;
  image?: string;
}

export interface AdminDashboardOrderItem {
  id?: number;
  name?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  product?: {
    id?: number;
    name?: string;
    price?: number;
    category?: string;
  };
}

export interface AdminDashboardOrder {
  id: number;
  customerId?: number;
  customerName?: string;
  email?: string;
  totalAmount?: number;
  createdAt?: string;
  status?: string;
  items?: AdminDashboardOrderItem[];
}

export interface AdminDashboardData {
  users: AdminDashboardUser[];
  products: AdminDashboardProduct[];
  orders: AdminDashboardOrder[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {

  private http = inject(HttpClient);

  private readonly API_URL = 'http://localhost:3000';

  getDashboardData(): Observable<AdminDashboardData> {

    return forkJoin({
      users: this.http.get<AdminDashboardUser[]>(
        `${this.API_URL}/users`
      ),

      products: this.http.get<AdminDashboardProduct[]>(
        `${this.API_URL}/products`
      ),

      orders: this.http.get<AdminDashboardOrder[]>(
        `${this.API_URL}/orders`
      )
    });

  }

}
