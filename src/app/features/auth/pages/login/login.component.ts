import {
  Component,
  inject,
  DestroyRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Router,
  RouterLink,
  ActivatedRoute
} from '@angular/router';

import { Store } from '@ngrx/store';

import {
  Actions,
  ofType
} from '@ngrx/effects';

import {
  take
} from 'rxjs';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

// Services
import { ToastService } from '../../../../core/services/toast.service';
import { PendingActionService } from '../../../../core/services/pending-action.service';

// Auth Actions
import {
  login,
  loginSuccess,
  loginFailure
} from '../../../../store/auth/auth.actions';

// Cart Actions
import {
  loadCart,
  addToCart
} from '../../../../store/cart/cart.actions';

// Wishlist Actions
import {
  loadWishlist,
  addToWishlist
} from '../../../../store/wishlist/wishlist.actions';

@Component({
  selector: 'app-login',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  private store = inject(Store);

  private actions$ = inject(Actions);

  private destroyRef = inject(DestroyRef);

  private toastService = inject(ToastService);

  private router = inject(Router);

  private route = inject(ActivatedRoute);

  private pendingActionService = inject(PendingActionService);

  // ============================================
  // FORM DATA
  // ============================================

  email = '';

  password = '';

  showPassword = false;

  errorMessage = '';

  successMessage = '';

  // ============================================
  // PASSWORD VISIBILITY
  // ============================================

  togglePasswordVisibility(): void {

    this.showPassword = !this.showPassword;

  }

  // ============================================
  // LOGIN
  // ============================================

  login(): void {

    this.errorMessage = '';

    this.successMessage = '';

    // Validate form
    if (!this.email.trim() || !this.password) {

      this.errorMessage =
        'Please enter your email and password.';

      return;

    }

    // Listen for login success
      this.actions$
          .pipe(
            ofType(loginSuccess),
            take(1),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(action => {

            this.handleLoginSuccess(action.user);

      });

    // Listen for login failure
    this.actions$
      .pipe(
        ofType(loginFailure),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(action => {

        this.errorMessage = action.error;

      });

    // Dispatch login action
    this.store.dispatch(
      login({
        email: this.email.trim(),
        password: this.password
      })
    );

  }

  // ============================================
  // LOGIN SUCCESS
  // ============================================

  private handleLoginSuccess(user: any): void {

        // Login success toast
        this.toastService.success(
          'Login successful! Welcome back.'
        );

        // ==========================================
        // ADMIN LOGIN
        // ==========================================

        if (user.role === 'admin') {

          this.pendingActionService.clearAction();

          this.router.navigate(['/admin/dashboard']);

          return;

        }

        // ==========================================
        // CUSTOMER LOGIN
        // ==========================================

        // Load cart through NgRx
        this.store.dispatch(loadCart());

        // Load wishlist through NgRx
        this.store.dispatch(loadWishlist());

        // Execute pending action
        this.executePendingAction();

      }

  // ============================================
  // PENDING ACTION
  // ============================================

  private executePendingAction(): void {

    const pendingAction =
      this.pendingActionService.getAction();

    // No pending action
    if (!pendingAction) {

      this.navigateAfterLogin();

      return;

    }

    // ==========================================
    // ADD TO CART
    // ==========================================

    if (pendingAction.type === 'ADD_TO_CART') {

      this.store.dispatch(
        addToCart({
          product: pendingAction.product,
          quantity: pendingAction.quantity ?? 1
        })
      );

      this.pendingActionService.clearAction();

      this.router.navigateByUrl(
        pendingAction.route ?? '/cart'
      );

      return;

    }

    // ==========================================
    // ADD TO WISHLIST
    // ==========================================

    if (pendingAction.type === 'ADD_TO_WISHLIST') {

      this.store.dispatch(
        addToWishlist({
          product: pendingAction.product
        })
      );

      this.pendingActionService.clearAction();

      this.router.navigate(['/wishlist']);

      return;

    }

    // ==========================================
    // BUY NOW
    // ==========================================

    if (pendingAction.type === 'BUY_NOW') {

      if (pendingAction.product) {

        this.pendingActionService.clearAction();

        this.router.navigate(['/checkout'], {

          queryParams: {
            productId: pendingAction.product.id,
            quantity: pendingAction.quantity ?? 1
          }

        });

      }

      return;

    }

    // ==========================================
    // NAVIGATION
    // ==========================================

    if (pendingAction.type === 'NAVIGATE') {

      const route = pendingAction.route;

      this.pendingActionService.clearAction();

      if (route) {

        this.router.navigateByUrl(route);

      } else {

        this.navigateAfterLogin();

      }

      return;

    }

    // ==========================================
    // DEFAULT NAVIGATION
    // ==========================================

    this.pendingActionService.clearAction();

    this.navigateAfterLogin();

  }

  // ============================================
  // DEFAULT NAVIGATION
  // ============================================

  private navigateAfterLogin(): void {

    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl');

    const destination =
      returnUrl && returnUrl.startsWith('/')
        ? returnUrl
        : '/';

    this.router.navigateByUrl(destination);

  }

}