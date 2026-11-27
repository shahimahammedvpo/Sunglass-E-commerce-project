
import {
  Component,
  inject,
  OnInit,
  DestroyRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';

import { take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// NgRx Auth Actions
import {
  updateProfile,
  updateProfileSuccess,
  updateProfileFailure,

  updateProfileImage,
  updateProfileImageSuccess,
  updateProfileImageFailure,

  logout,
  logoutSuccess
} from '../../../../store/auth/auth.actions';

// NgRx Auth Selectors
import {
  selectCurrentUser
} from '../../../../store/auth/auth.selectors';

// Models
import { AuthUser } from '../../../../core/models/user.model';

// Services
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

  private store = inject(Store);

  private actions$ = inject(Actions);

  private destroyRef = inject(DestroyRef);

  private router = inject(Router);

  private toastService = inject(ToastService);

  // ==================== CURRENT USER ====================

  currentUser: AuthUser | null = null;

  // ==================== PROFILE INFORMATION ====================

  fullName = '';

  email = '';

  // ==================== PROFILE IMAGE ====================

  profileImage = '';

  selectedImage: File | null = null;

  imagePreview = '';

  imageMessage = '';

  imageError = '';

  isImageUploading = false;

  private readonly MAX_IMAGE_SIZE = 2 * 1024 * 1024;

  // ==================== PROFILE EDITING ====================

  editMode = false;

  profileMessage = '';

  profileError = '';

  // ==================== LOGOUT MODAL ====================

  showLogoutModal = false;

  // ==================== LIFECYCLE ====================

  ngOnInit(): void {

    this.store.select(selectCurrentUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {

        this.currentUser = user;

        if (user) {
          this.loadProfile();
        }

      });

  }

  // ==================== LOAD PROFILE ====================

  loadProfile(): void {

    const user = this.currentUser;

    if (!user) {
      return;
    }

    this.fullName = user.fullName;

    this.email = user.email;

    this.profileImage = user.profileImage || '';

  }

  // ==================== PROFILE IMAGE ====================

  onImageSelected(event: Event): void {

    this.imageMessage = '';

    this.imageError = '';

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Validate image format
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {

      this.imageError =
        'Please select a JPG, PNG, or WebP image.';

      input.value = '';

      return;

    }

    // Validate file size
    if (file.size > this.MAX_IMAGE_SIZE) {

      this.imageError =
        'Image size must be less than 2 MB.';

      input.value = '';

      return;

    }

    this.selectedImage = file;

    // Preview image
    const reader = new FileReader();

    reader.onload = () => {

      this.imagePreview = reader.result as string;

    };

    reader.onerror = () => {

      this.imageError =
        'Unable to preview this image.';

      this.selectedImage = null;

      this.imagePreview = '';

    };

    reader.readAsDataURL(file);

  }

  // ==================== SAVE PROFILE IMAGE ====================

  updateProfileImage(): void {

    if (!this.selectedImage || !this.imagePreview) {
      return;
    }

    if (this.isImageUploading) {
      return;
    }

    this.imageMessage = '';

    this.imageError = '';

    this.isImageUploading = true;

    // Listen for success
    this.actions$
      .pipe(
        ofType(updateProfileImageSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(action => {

        this.isImageUploading = false;

        this.profileImage = action.user.profileImage || '';

        this.selectedImage = null;

        this.imagePreview = '';

        this.imageMessage =
          'Profile image updated successfully.';

      });

    // Listen for failure
    this.actions$
      .pipe(
        ofType(updateProfileImageFailure),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(action => {

        this.isImageUploading = false;

        this.imageError = action.error;

      });

    // Dispatch action
    this.store.dispatch(
      updateProfileImage({
        image: this.imagePreview
      })
    );

  }

  // ==================== CANCEL IMAGE UPDATE ====================

  cancelImageUpdate(): void {

    this.selectedImage = null;

    this.imagePreview = '';

    this.imageMessage = '';

    this.imageError = '';

  }

  // ==================== REMOVE PROFILE IMAGE ====================

  removeProfileImage(): void {

    if (this.isImageUploading) {
      return;
    }

    this.imageMessage = '';

    this.imageError = '';

    this.isImageUploading = true;

    // Listen for success
    this.actions$
      .pipe(
        ofType(updateProfileImageSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        this.isImageUploading = false;

        this.profileImage = '';

        this.imagePreview = '';

        this.selectedImage = null;

        this.imageMessage =
          'Profile image removed successfully.';

      });

    // Listen for failure
    this.actions$
      .pipe(
        ofType(updateProfileImageFailure),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(action => {

        this.isImageUploading = false;

        this.imageError = action.error;

      });

    // Dispatch action
    this.store.dispatch(
      updateProfileImage({
        image: ''
      })
    );

  }

  // ==================== PROFILE EDITING ====================

  enableEdit(): void {

    this.loadProfile();

    this.editMode = true;

    this.profileMessage = '';

    this.profileError = '';

  }

  cancelEdit(): void {

    this.loadProfile();

    this.editMode = false;

    this.profileError = '';

    this.profileMessage = '';

  }

  updateProfile(): void {

    this.profileMessage = '';

    this.profileError = '';

    if (!this.fullName.trim() || !this.email.trim()) {

      this.profileError =
        'Please fill in all fields.';

      return;

    }

    // Listen for success
    this.actions$
      .pipe(
        ofType(updateProfileSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(action => {

        this.profileMessage = action.message;

        this.editMode = false;

        this.loadProfile();

      });

    // Listen for failure
    this.actions$
      .pipe(
        ofType(updateProfileFailure),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(action => {

        this.profileError = action.error;

      });

    // Dispatch action
    this.store.dispatch(
      updateProfile({
        fullName: this.fullName.trim(),
        email: this.email.trim()
      })
    );

  }

  // ==================== LOGOUT ====================

  logout(): void {

    this.showLogoutModal = true;

  }

  // ==================== CANCEL LOGOUT ====================

  cancelLogout(): void {

    this.showLogoutModal = false;

  }

  // ==================== CONFIRM LOGOUT ====================

  confirmLogout(): void {

    this.showLogoutModal = false;

    // Listen for successful logout
    this.actions$
      .pipe(
        ofType(logoutSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        this.toastService.info(
          'You have been logged out successfully.'
        );

        this.router.navigate(['/login']);

      });

    // Dispatch logout action
    this.store.dispatch(logout());

  }

}
