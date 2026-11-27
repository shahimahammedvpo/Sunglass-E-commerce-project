
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  profileImage?: string;
  role?: 'admin' | 'customer';
  isBlocked?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {

  private http = inject(HttpClient);

  private readonly API_URL = 'http://localhost:3000/users';

  // ========================================
  // GET ALL CUSTOMERS
  // ========================================

  getCustomers(): Observable<AdminUser[]> {

    return this.http.get<AdminUser[]>(this.API_URL).pipe(

      map(users =>
        users
          .filter(user => user.role !== 'admin')
          .map(user => ({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            profileImage: user.profileImage || '',
            role: user.role || 'customer',
            isBlocked: user.isBlocked ?? false
          }))
      )

    );

  }

  // ========================================
  // BLOCK / UNBLOCK CUSTOMER
  // ========================================

  updateBlockStatus(
    userId: number,
    isBlocked: boolean
  ): Observable<AdminUser> {

    return this.http.patch<AdminUser>(
      `${this.API_URL}/${userId}`,
      { isBlocked }
    );

  }

}
