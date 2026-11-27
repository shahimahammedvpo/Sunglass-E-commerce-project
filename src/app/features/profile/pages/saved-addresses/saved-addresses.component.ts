import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  RouterLink,
  RouterLinkActive,
  Router
} from '@angular/router';

import { FormControl } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { AddressService } from '../../../../core/services/address.service';
import { Address } from '../../../../core/models/address.model';
import { ToastService } from '../../../../core/services/toast.service';
import { CustomValidators } from '../../../../shared/validators/custom-validators';

@Component({
  selector: 'app-saved-addresses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './saved-addresses.component.html',
  styleUrl: './saved-addresses.component.scss'
})
export class SavedAddressesComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private addressService = inject(AddressService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // ==================== CONSTANTS ====================

  readonly MAX_ADDRESSES = 3;

  // ==================== USER ====================

  userId!: number;

  // ==================== ADDRESS DATA ====================

  addresses: Address[] = [];

  editingAddress: Address | null = null;

  addressToDelete: Address | null = null;

  // ==================== MODAL STATES ====================

  showAddressModal = false;

  showDeleteModal = false;

  showLogoutModal = false;

  isAddingAddress = false;

  // ==================== LOADING STATES ====================

  isLoading = false;

  isSaving = false;

  isDeleting = false;

  // ==================== ADDRESS LIMIT MESSAGE ====================

  showAddressLimitMessage = false;

  private addressLimitTimer: ReturnType<typeof setTimeout> | null = null;

  // ==================== VALIDATION ====================

  addressFieldTouched: Record<string, boolean> = {};

  addressValidationErrors: Record<string, string> = {};

  // ==================== GETTERS ====================

  get canAddAddress(): boolean {
    return this.addresses.length < this.MAX_ADDRESSES;
  }

  // ==================== LIFECYCLE ====================

  ngOnInit(): void {
    this.loadUserAddresses();
  }

  ngOnDestroy(): void {

    if (this.addressLimitTimer) {
      clearTimeout(this.addressLimitTimer);
    }

  }

  // ==================== LOAD ADDRESSES ====================

  loadUserAddresses(): void {

    const user = this.authService.getCurrentUser();

    if (!user) {

      this.toastService.warning(
        'Please login to view your saved addresses.'
      );

      return;

    }

    this.userId = user.id;

    this.isLoading = true;

    this.addressService.getAddresses(this.userId)
      .subscribe({

        next: (addresses) => {

          this.addresses = addresses;

          this.isLoading = false;

        },

        error: (error) => {

          console.error('Address loading error:', error);

          this.isLoading = false;

          this.toastService.error(
            'Unable to load saved addresses. Please try again.'
          );

        }

      });

  }

  // ==================== ADD ADDRESS ====================

  openAddAddressModal(): void {

    if (!this.canAddAddress) {

      this.showAddressLimitNotification();

      return;

    }

    this.resetAddressValidation();

    this.isAddingAddress = true;

    this.editingAddress = {
      userId: this.userId,
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      addressType: 'Home',
      isDefault: this.addresses.length === 0
    } as Address;

    this.showAddressModal = true;

  }

  // ==================== EDIT ADDRESS ====================

  editAddress(address: Address): void {

    this.resetAddressValidation();

    this.isAddingAddress = false;

    this.editingAddress = { ...address };

    this.showAddressModal = true;

  }

  // ==================== CLOSE ADDRESS MODAL ====================

  closeAddressModal(): void {

    if (this.isSaving) {
      return;
    }

    this.showAddressModal = false;

    this.editingAddress = null;

    this.isAddingAddress = false;

    this.resetAddressValidation();

  }

  // ==================== LIVE VALIDATION ====================

  markAddressFieldTouched(field: string): void {

    this.addressFieldTouched[field] = true;

    this.validateAddressField(field);

  }

  validateAddressField(field: string): void {

    if (!this.editingAddress) {
      return;
    }

    const value = (this.editingAddress as any)[field];

    let validator: any = null;

    switch (field) {

      case 'fullName':
        validator = CustomValidators.fullName();
        break;

      case 'phone':
        validator = CustomValidators.indianMobile();
        break;

      case 'city':
        validator = CustomValidators.city();
        break;

      case 'state':
        validator = CustomValidators.state();
        break;

      case 'postalCode':
        validator = CustomValidators.indianPincode();
        break;

    }

    // Required validation
    const requiredFields = [
      'fullName',
      'phone',
      'addressLine1',
      'city',
      'state',
      'postalCode'
    ];

    if (
      requiredFields.includes(field) &&
      (!value || !String(value).trim())
    ) {

      this.addressValidationErrors[field] =
        'This field is required.';

      return;

    }

    // Optional field
    if (!value || !String(value).trim()) {

      delete this.addressValidationErrors[field];

      return;

    }

    // Custom validation
    if (validator) {

      const control = new FormControl(value, validator);

      const errors = control.errors;

      if (errors) {

        if (errors['invalidName']) {
          this.addressValidationErrors[field] =
            'Name must contain only letters and spaces.';
        }

        else if (errors['minNameLength']) {
          this.addressValidationErrors[field] =
            'Name must contain at least 3 characters.';
        }

        else if (errors['invalidMobile']) {
          this.addressValidationErrors[field] =
            'Enter a valid 10-digit Indian mobile number.';
        }

        else if (errors['invalidCity']) {
          this.addressValidationErrors[field] =
            'City must contain only letters and spaces.';
        }

        else if (errors['invalidState']) {
          this.addressValidationErrors[field] =
            'State must contain only letters and spaces.';
        }

        else if (errors['invalidPincode']) {
          this.addressValidationErrors[field] =
            'Enter a valid 6-digit Indian PIN code.';
        }

        return;

      }

    }

    delete this.addressValidationErrors[field];

  }

  getAddressValidationMessage(field: string): string {

    if (!this.addressFieldTouched[field]) {
      return '';
    }

    this.validateAddressField(field);

    return this.addressValidationErrors[field] || '';

  }

  hasAddressValidationError(field: string): boolean {

    return !!this.getAddressValidationMessage(field);

  }

  resetAddressValidation(): void {

    this.addressFieldTouched = {};

    this.addressValidationErrors = {};

  }

  // ==================== VALIDATE FORM ====================

  validateAddressForm(): boolean {

    const fieldsToValidate = [
      'fullName',
      'phone',
      'addressLine1',
      'city',
      'state',
      'postalCode'
    ];

    fieldsToValidate.forEach(field => {

      this.addressFieldTouched[field] = true;

      this.validateAddressField(field);

    });

    return !fieldsToValidate.some(
      field => !!this.addressValidationErrors[field]
    );

  }

  // ==================== SAVE ADDRESS ====================

  saveAddress(): void {

  if (!this.editingAddress) {
    return;
  }

  if (!this.validateAddressForm()) {

    this.toastService.warning(
      'Please correct the errors in the form.'
    );

    return;

  }

  // Enforce address limit
  if (
    this.isAddingAddress &&
    this.addresses.length >= this.MAX_ADDRESSES
  ) {

    this.showAddressLimitNotification();

    return;

  }

  this.isSaving = true;

  const savedAddress: Address = {
    ...this.editingAddress,
    fullName: this.editingAddress.fullName.trim(),
    phone: this.editingAddress.phone.trim(),
    addressLine1: this.editingAddress.addressLine1.trim(),
    addressLine2: this.editingAddress.addressLine2?.trim() || '',
    city: this.editingAddress.city.trim(),
    state: this.editingAddress.state.trim(),
    postalCode: this.editingAddress.postalCode.trim()
  };

  // ==================== ADD ====================

  if (this.isAddingAddress) {

    // First address should automatically become default
    if (this.addresses.length === 0) {
      savedAddress.isDefault = true;
    }

    // If new address is selected as default,
    // remove default status from all existing addresses
    if (savedAddress.isDefault) {

      const updatedAddresses = this.addresses.map(address => ({
        ...address,
        isDefault: false
      }));

      const updateExistingAddresses = () => {

        if (updatedAddresses.length === 0) {

          this.addNewAddress(savedAddress);

          return;

        }

        forkJoin(
          updatedAddresses.map(address =>
            this.addressService.updateAddress(
              address.id!,
              address
            )
          )
        ).subscribe({

          next: () => {
            this.addNewAddress(savedAddress);
          },

          error: (error) => {

            console.error(
              'Default address update error:',
              error
            );

            this.isSaving = false;

            this.toastService.error(
              'Unable to update default address. Please try again.'
            );

          }

        });

      };

      updateExistingAddresses();

    } else {

      // Add without changing the current default
      this.addNewAddress(savedAddress);

    }

    return;

  }

  // ==================== UPDATE ====================

  if (!savedAddress.id) {

    this.isSaving = false;

    return;

  }

  // If edited address is selected as default,
  // make all other addresses non-default
  if (savedAddress.isDefault) {

    const updatedAddresses = this.addresses.map(address => ({
      ...address,
      isDefault: address.id === savedAddress.id
    }));

    forkJoin(
      updatedAddresses.map(address =>
        this.addressService.updateAddress(
          address.id!,
          address
        )
      )
    ).subscribe({

      next: () => {

        this.isSaving = false;

        this.showAddressModal = false;

        this.editingAddress = null;

        this.toastService.success(
          'Address updated successfully!'
        );

        this.loadUserAddresses();

      },

      error: (error) => {

        console.error(
          'Address update error:',
          error
        );

        this.isSaving = false;

        this.toastService.error(
          'Unable to update address. Please try again.'
        );

      }

    });

    return;

  }

  // Normal update without changing default address
  this.addressService.updateAddress(
    savedAddress.id,
    savedAddress
  ).subscribe({

    next: () => {

      this.isSaving = false;

      this.showAddressModal = false;

      this.editingAddress = null;

      this.toastService.success(
        'Address updated successfully!'
      );

      this.loadUserAddresses();

    },

    error: (error) => {

      console.error(
        'Address update error:',
        error
      );

      this.isSaving = false;

      this.toastService.error(
        'Unable to update address. Please try again.'
      );

    }

  });

}


// helper method
private addNewAddress(savedAddress: Address): void {

  this.addressService.addAddress(savedAddress)
    .subscribe({

      next: () => {

        this.isSaving = false;

        this.showAddressModal = false;

        this.editingAddress = null;

        this.isAddingAddress = false;

        this.toastService.success(
          'Address added successfully!'
        );

        // Show message when third address is added
        if (this.addresses.length === 2) {
          this.showAddressLimitNotification();
        }

        this.loadUserAddresses();

      },

      error: (error) => {

        console.error(
          'Address adding error:',
          error
        );

        this.isSaving = false;

        this.toastService.error(
          'Unable to add address. Please try again.'
        );

      }

    });

}

  // ==================== ADDRESS LIMIT NOTIFICATION ====================

  showAddressLimitNotification(): void {

    this.showAddressLimitMessage = true;

    if (this.addressLimitTimer) {
      clearTimeout(this.addressLimitTimer);
    }

    this.addressLimitTimer = setTimeout(() => {

      this.showAddressLimitMessage = false;

    }, 3000);

  }

  // ==================== DELETE ADDRESS MODAL ====================

  openDeleteModal(address: Address): void {

    this.addressToDelete = address;

    this.showDeleteModal = true;

  }

  cancelDelete(): void {

    this.showDeleteModal = false;

    this.addressToDelete = null;

  }

  confirmDelete(): void {

    if (
      !this.addressToDelete ||
      !this.addressToDelete.id
    ) {
      return;
    }

    this.isDeleting = true;

    const addressId = this.addressToDelete.id;

    this.addressService.deleteAddress(addressId)
      .subscribe({

        next: () => {

          this.isDeleting = false;

          this.showDeleteModal = false;

          this.addressToDelete = null;

          this.toastService.success(
            'Address deleted successfully!'
          );

          this.loadUserAddresses();

        },

        error: (error) => {

          console.error('Address delete error:', error);

          this.isDeleting = false;

          this.toastService.error(
            'Unable to delete address. Please try again.'
          );

        }

      });

  }

  // ==================== SET DEFAULT ADDRESS ====================

  setDefaultAddress(selectedAddress: Address): void {
  const updatedAddresses = this.addresses.map(address => ({
    ...address,
    isDefault: address.id === selectedAddress.id
  }));

  forkJoin(
    updatedAddresses.map(address =>
      this.addressService.updateAddress(address.id!, address)
    )
  ).subscribe({
    next: () => {
      this.addresses = updatedAddresses;
      this.toastService.success('Default address updated successfully');
    },
    error: () => {
      this.toastService.error('Failed to update default address');
    }
  });
}

  // ==================== LOGOUT ====================

  logout(): void {

    this.showLogoutModal = true;

  }

  cancelLogout(): void {

    this.showLogoutModal = false;

  }

  confirmLogout(): void {

    this.showLogoutModal = false;

    this.authService.logout();

    this.toastService.info(
      'You have been logged out successfully.'
    );

    this.router.navigate(['/login']);

  }

}