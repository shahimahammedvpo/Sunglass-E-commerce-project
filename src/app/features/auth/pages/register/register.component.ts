
import {
  Component,
  inject,
  DestroyRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import { Actions, ofType } from '@ngrx/effects';

import { take } from 'rxjs';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// NgRx Store
import { Store } from '@ngrx/store';

import {
  register,
  registerSuccess,
  registerFailure
} from '../../../../store/auth/auth.actions';

import { FormErrorComponent } from '../../../../shared/components/form-error/form-error.component';

@Component({
  selector: 'app-register',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ReactiveFormsModule,
    FormErrorComponent
  ],

  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  private store = inject(Store);

  private actions$ = inject(Actions);

  private destroyRef = inject(DestroyRef);

  private router = inject(Router);

  // ============================================
  // FORM FIELDS
  // ============================================

  fullName = '';

  email = '';

  password = '';

  confirmPassword = '';

  // ============================================
  // PASSWORD VISIBILITY
  // ============================================

  showPassword = false;

  showConfirmPassword = false;

  // ============================================
  // MESSAGES
  // ============================================

  errorMessage = '';

  successMessage = '';

  // ============================================
  // LOADING STATE
  // ============================================

  isLoading = false;

  // ============================================
  // PASSWORD VALIDATION PATTERN
  // ============================================

  passwordPattern =
    '^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$';

  // ============================================
  // PASSWORD REQUIREMENT CHECKS
  // ============================================

  hasMinimumLength(): boolean {

    return this.password.length >= 8;

  }

  hasUppercase(): boolean {

    return /[A-Z]/.test(this.password);

  }

  hasLowercase(): boolean {

    return /[a-z]/.test(this.password);

  }

  hasNumber(): boolean {

    return /[0-9]/.test(this.password);

  }

  hasSpecialCharacter(): boolean {

    return /[!@#$%^&*(),.?":{}|<>]/.test(this.password);

  }

  // ============================================
  // PASSWORD VISIBILITY
  // ============================================

  togglePassword(): void {

    this.showPassword = !this.showPassword;

  }

  toggleConfirmPassword(): void {

    this.showConfirmPassword = !this.showConfirmPassword;

  }

  // ============================================
  // REGISTER
  // ============================================

  register(): void {

    this.errorMessage = '';

    this.successMessage = '';

    // Validate required fields
    if (
      !this.fullName.trim() ||
      !this.email.trim() ||
      !this.password ||
      !this.confirmPassword
    ) {

      this.errorMessage = 'Please fill in all required fields.';

      return;

    }

    // Validate password matching
    if (this.password !== this.confirmPassword) {

      this.errorMessage = 'Passwords do not match.';

      return;

    }

    // Prevent duplicate submissions
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    // Listen for registration success
    this.actions$
      .pipe(
        ofType(registerSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(action => {

        this.isLoading = false;

        this.successMessage = action.message;

        // Navigate to login after successful registration
        setTimeout(() => {

          this.router.navigate(['/login']);

        }, 1000);

      });

    // Listen for registration failure
    this.actions$
      .pipe(
        ofType(registerFailure),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(action => {

        this.isLoading = false;

        this.errorMessage = action.error;

      });

    // Dispatch registration action
    this.store.dispatch(
      register({

        fullName: this.fullName.trim(),

        email: this.email.trim(),

        password: this.password

      })
    );

  }

}
