
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, of } from 'rxjs';

import {
  catchError,
  map,
  switchMap
} from 'rxjs/operators';

import {
  User,
  AuthUser
} from '../models/user.model';

export interface AuthResult {
  success: boolean;
  message: string;
  user?: AuthUser;
}

type AuthStorage = 'local' | 'session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/users';

  private readonly currentUserKey = 'sunstyle_current_user';

  // Remembers which storage this particular tab uses.
  private readonly storageModeKey = 'sunstyle_auth_storage_mode';

  // ============================================
  // GET ACTIVE STORAGE MODE
  // ============================================

  private getStorageMode(): AuthStorage | null {

    const mode = sessionStorage.getItem(this.storageModeKey);

    if (mode === 'session' || mode === 'local') {
      return mode;
    }

    return null;
  }

  // ============================================
  // GET STORAGE FOR CURRENT TAB
  // ============================================

  private getActiveStorage(): Storage {

    const mode = this.getStorageMode();

    if (mode === 'session') {
      return sessionStorage;
    }

    if (mode === 'local') {
      return localStorage;
    }

    // First-time tab initialization:
    // Prefer an existing admin session in this tab.
    if (sessionStorage.getItem(this.currentUserKey)) {
      return sessionStorage;
    }

    // Otherwise restore the shared customer session.
    return localStorage;
  }

  // ============================================
  // CONVERT DATABASE USER TO SAFE AUTH USER
  // ============================================

  private createSafeUser(user: User): AuthUser {

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      profileImage: user.profileImage || '',
      role: user.role || 'customer',
      isBlocked: user.isBlocked ?? false
    };

  }

  // ============================================
  // GET SAVED USER
  // ============================================

  getSavedUser(): AuthUser | null {

    try {

      const storage = this.getActiveStorage();

      return JSON.parse(
        storage.getItem(this.currentUserKey) || 'null'
      );

    } catch {

      return null;

    }

  }

  // ============================================
  // SAVE CURRENT USER
  // ============================================

  saveCurrentUser(user: AuthUser): void {

    if (user.role === 'admin') {

      // Admin uses this tab's sessionStorage.
      sessionStorage.setItem(
        this.storageModeKey,
        'session'
      );

      sessionStorage.setItem(
        this.currentUserKey,
        JSON.stringify(user)
      );

    } else {

      // Customer uses shared localStorage.
      sessionStorage.setItem(
        this.storageModeKey,
        'local'
      );

      // Remove any previous admin session in this tab.
      sessionStorage.removeItem(this.currentUserKey);

      localStorage.setItem(
        this.currentUserKey,
        JSON.stringify(user)
      );

    }

  }

  // ============================================
  // REGISTER CUSTOMER
  // ============================================

  register(
    fullName: string,
    email: string,
    password: string
  ): Observable<AuthResult> {

    const normalizedEmail = email.trim().toLowerCase();

    return this.http.get<User[]>(
      `${this.apiUrl}?email=${encodeURIComponent(normalizedEmail)}`
    ).pipe(

      switchMap(users => {

        const existingUser = users.some(
          user => user.email.toLowerCase() === normalizedEmail
        );

        if (existingUser) {

          return of({
            success: false,
            message: 'An account with this email already exists.'
          });

        }

        const newUser: Omit<User, 'id'> = {
          fullName: fullName.trim(),
          email: normalizedEmail,
          password,
          profileImage: '',
          role: 'customer',
          isBlocked: false
        };

        return this.http.post<User>(
          this.apiUrl,
          newUser
        ).pipe(

          map(() => ({
            success: true,
            message: 'Registration successful. Please log in.'
          }))

        );

      }),

      catchError(error => {

        console.error('Registration error:', error);

        return of({
          success: false,
          message: 'Unable to register. Please try again.'
        });

      })

    );

  }

  // ============================================
  // LOGIN
  // ============================================

  login(
    email: string,
    password: string
  ): Observable<AuthResult> {

    const normalizedEmail = email.trim().toLowerCase();

    return this.http.get<User[]>(
      `${this.apiUrl}?email=${encodeURIComponent(normalizedEmail)}`
    ).pipe(

      map(users => {

        const user = users.find(
          item =>
            item.email.toLowerCase() === normalizedEmail &&
            item.password === password
        );

        if (!user) {

          return {
            success: false,
            message: 'Invalid email or password.'
          };

        }

        if (user.isBlocked === true) {

          return {
            success: false,
            message: 'Your account has been blocked. Please contact support.'
          };

        }

        const safeUser = this.createSafeUser(user);

        // Automatically selects storage according to role.
        this.saveCurrentUser(safeUser);

        return {
          success: true,
          message: 'Login successful!',
          user: safeUser
        };

      }),

      catchError(error => {

        console.error('Login error:', error);

        return of({
          success: false,
          message: 'Unable to login. Please try again.'
        });

      })

    );

  }

  // ============================================
  // VERIFY CURRENT USER FROM DATABASE
  // ============================================

  verifyCurrentUser(): Observable<AuthUser | null> {

    const savedUser = this.getSavedUser();

    if (!savedUser) {
      return of(null);
    }

    return this.http.get<User>(
      `${this.apiUrl}/${savedUser.id}`
    ).pipe(

      map(user => {

        if (!user || user.isBlocked === true) {

          this.logout();

          return null;

        }

        const safeUser = this.createSafeUser(user);

        // Update the same storage used by this tab.
        this.saveCurrentUser(safeUser);

        return safeUser;

      }),

      catchError(error => {

        console.error('Session verification error:', error);

        // Keep the saved session during temporary network errors.
        return of(null);

      })

    );

  }

  // ============================================
  // LOGOUT
  // ============================================

  logout(): void {

    const mode = this.getStorageMode();

    if (mode === 'session') {

      // Remove only this tab's admin session.
      sessionStorage.removeItem(this.currentUserKey);

      // Keep the session mode so this tab does not
      // accidentally restore a customer from localStorage.
      sessionStorage.setItem(
        this.storageModeKey,
        'session'
      );

    } else {

      // Remove the shared customer session.
      localStorage.removeItem(this.currentUserKey);

      // Keep this tab in customer mode.
      sessionStorage.setItem(
        this.storageModeKey,
        'local'
      );

    }

  }

  // ============================================
  // CHECK LOGIN STATUS
  // ============================================

  isLoggedIn(): boolean {

    return this.getSavedUser() !== null;

  }

  // ============================================
  // GET CURRENT USER
  // ============================================

  getCurrentUser(): AuthUser | null {

    return this.getSavedUser();

  }

  // ============================================
  // UPDATE PROFILE
  // ============================================

  updateProfile(
    fullName: string,
    email: string
  ): Observable<AuthResult> {

    const currentUser = this.getCurrentUser();

    if (!currentUser) {

      return of({
        success: false,
        message: 'Please login first.'
      });

    }

    const normalizedEmail = email.trim().toLowerCase();

    return this.http.get<User[]>(
      `${this.apiUrl}?email=${encodeURIComponent(normalizedEmail)}`
    ).pipe(

      switchMap(users => {

        const emailExists = users.some(
          user =>
            user.id !== currentUser.id &&
            user.email.toLowerCase() === normalizedEmail
        );

        if (emailExists) {

          return of({
            success: false,
            message: 'This email is already registered.'
          });

        }

        return this.http.patch<User>(
          `${this.apiUrl}/${currentUser.id}`,
          {
            fullName: fullName.trim(),
            email: normalizedEmail
          }
        ).pipe(

          map(updatedUser => {

            const safeUser = this.createSafeUser(updatedUser);

            this.saveCurrentUser(safeUser);

            return {
              success: true,
              message: 'Profile updated successfully!',
              user: safeUser
            };

          })

        );

      }),

      catchError(error => {

        console.error('Profile update error:', error);

        return of({
          success: false,
          message: 'Unable to update profile. Please try again.'
        });

      })

    );

  }

  // ============================================
  // UPDATE PROFILE IMAGE
  // ============================================

  updateProfileImage(
    image: string
  ): Observable<AuthResult> {

    const currentUser = this.getCurrentUser();

    if (!currentUser) {

      return of({
        success: false,
        message: 'Please login first.'
      });

    }

    return this.http.patch<User>(
      `${this.apiUrl}/${currentUser.id}`,
      {
        profileImage: image
      }
    ).pipe(

      map(updatedUser => {

        const safeUser = this.createSafeUser(updatedUser);

        this.saveCurrentUser(safeUser);

        return {
          success: true,
          message: image
            ? 'Profile image updated successfully!'
            : 'Profile image removed successfully.',
          user: safeUser
        };

      }),

      catchError(error => {

        console.error('Profile image update error:', error);

        return of({
          success: false,
          message: 'Unable to update profile image. Please try again.'
        });

      })

    );

  }

}
