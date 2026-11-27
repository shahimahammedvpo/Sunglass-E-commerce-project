
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Coupon, CouponDiscountType } from '../../../../core/models/coupon.model';
import { AdminCouponsService } from '../../services/admin-coupons.service';

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coupons.component.html',
  styleUrl: './coupons.component.scss'
})
export class CouponsComponent implements OnInit, OnDestroy {
  private couponsService = inject(AdminCouponsService);

  coupons: Coupon[] = [];

  loading = false;
  saving = false;
  deleting = false;

  errorMessage = '';
  successMessage = '';

  // Message auto-dismiss
  private messageTimeout: ReturnType<typeof setTimeout> | null = null;
  readonly messageDuration = 3000;

  searchTerm = '';

  selectedStatus = 'all';
  selectedDiscountType = 'all';

  currentPage = 1;
  itemsPerPage = 5;

  // Dropdowns
  isStatusDropdownOpen = false;
  isTypeDropdownOpen = false;

  // Modals
  showCouponModal = false;
  showDeleteModal = false;

  isEditMode = false;
  selectedCoupon: Coupon | null = null;

  form: Coupon = this.createEmptyForm();

  readonly statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Expired', value: 'expired' }
  ];

  readonly typeOptions = [
    { label: 'All Types', value: 'all' },
    { label: 'Percentage', value: 'percentage' },
    { label: 'Fixed Amount', value: 'fixed' }
  ];

  ngOnInit(): void {
    this.loadCoupons();
  }

  createEmptyForm(): Coupon {
    return {
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscount: 200,
      isActive: true,
      expiryDate: ''
    };
  }

  // Load coupons
  loadCoupons(): void {
    this.loading = true;
    this.errorMessage = '';

    this.couponsService.getCoupons().subscribe({
      next: (coupons) => {
        this.coupons = coupons.sort((a, b) =>
          a.code.localeCompare(b.code)
        );

        this.loading = false;
      },
      error: (error) => {
        console.error('Coupons loading error:', error);
        this.loading = false;
        this.showMessage('error', 'Unable to load coupons.');
      }
    });
  }

  // Current date
  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Summary cards
  get activeCoupons(): number {
    return this.coupons.filter(
      coupon => coupon.isActive && coupon.expiryDate >= this.today
    ).length;
  }

  get inactiveCoupons(): number {
    return this.coupons.filter(
      coupon => !coupon.isActive
    ).length;
  }

  get expiredCoupons(): number {
    return this.coupons.filter(
      coupon => coupon.expiryDate < this.today
    ).length;
  }

  // Filtering
  get filteredCoupons(): Coupon[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.coupons.filter(coupon => {
      const matchesSearch =
        coupon.code.toLowerCase().includes(search) ||
        coupon.description.toLowerCase().includes(search);

      let matchesStatus = true;

      if (this.selectedStatus === 'active') {
        matchesStatus =
          coupon.isActive && coupon.expiryDate >= this.today;
      } else if (this.selectedStatus === 'inactive') {
        matchesStatus = !coupon.isActive;
      } else if (this.selectedStatus === 'expired') {
        matchesStatus = coupon.expiryDate < this.today;
      }

      const matchesType =
        this.selectedDiscountType === 'all' ||
        coupon.discountType === this.selectedDiscountType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  // Pagination
  get totalPages(): number {
    return Math.ceil(this.filteredCoupons.length / this.itemsPerPage);
  }

  get paginatedCoupons(): Coupon[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;

    return this.filteredCoupons.slice(
      start,
      start + this.itemsPerPage
    );
  }

  get startIndex(): number {
    return this.filteredCoupons.length === 0
      ? 0
      : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endIndex(): number {
    return Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredCoupons.length
    );
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get pages(): number[] {
    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }

  // Custom dropdowns
  toggleStatusDropdown(): void {
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
    this.isTypeDropdownOpen = false;
  }

  toggleTypeDropdown(): void {
    this.isTypeDropdownOpen = !this.isTypeDropdownOpen;
    this.isStatusDropdownOpen = false;
  }

  closeAllDropdowns(): void {
    this.isStatusDropdownOpen = false;
    this.isTypeDropdownOpen = false;
  }

  selectStatus(value: string): void {
    this.selectedStatus = value;
    this.currentPage = 1;
    this.closeAllDropdowns();
  }

  selectDiscountType(value: string): void {
    this.selectedDiscountType = value;
    this.currentPage = 1;
    this.closeAllDropdowns();
  }

  get selectedStatusLabel(): string {
    return this.statusOptions.find(
      option => option.value === this.selectedStatus
    )?.label ?? 'All Status';
  }

  get selectedTypeLabel(): string {
    return this.typeOptions.find(
      option => option.value === this.selectedDiscountType
    )?.label ?? 'All Types';
  }

  // Add coupon
  openAddCoupon(): void {
    this.isEditMode = false;
    this.selectedCoupon = null;
    this.form = this.createEmptyForm();
    this.clearMessages();
    this.showCouponModal = true;
  }

  // Edit coupon
  openEditCoupon(coupon: Coupon): void {
    this.isEditMode = true;
    this.selectedCoupon = coupon;

    this.form = {
      ...coupon,
      maxDiscount: coupon.maxDiscount ?? null
    };

    this.clearMessages();
    this.showCouponModal = true;
  }

  closeCouponModal(): void {
    if (this.saving) return;

    this.showCouponModal = false;
    this.form = this.createEmptyForm();
  }

  onDiscountTypeChange(type: CouponDiscountType): void {
    this.form.discountType = type;

    if (type === 'fixed') {
      this.form.maxDiscount = null;
    } else if (this.form.maxDiscount === null) {
      this.form.maxDiscount = 200;
    }
  }

  // Save coupon
  saveCoupon(): void {
    this.clearMessages();

    this.form.code = this.form.code.trim().toUpperCase();
    this.form.description = this.form.description.trim();

    if (!this.form.code || !this.form.description || !this.form.expiryDate) {
      this.showMessage('error', 'Please complete all required fields.');
      return;
    }

    if (!/^[A-Z0-9_-]+$/.test(this.form.code)) {
      this.showMessage(
        'error',
        'Coupon code can contain only letters, numbers, hyphens and underscores.'
      );
      return;
    }

    if (
      !Number.isFinite(this.form.discountValue) ||
      this.form.discountValue <= 0
    ) {
      this.showMessage('error', 'Enter a valid discount value.');
      return;
    }

    if (
      this.form.discountType === 'percentage' &&
      this.form.discountValue > 100
    ) {
      this.showMessage('error', 'Percentage discount cannot exceed 100%.');
      return;
    }

    if (
      !Number.isFinite(this.form.minOrderAmount) ||
      this.form.minOrderAmount < 0
    ) {
      this.showMessage('error', 'Enter a valid minimum order amount.');
      return;
    }

    if (
      this.form.discountType === 'percentage' &&
      this.form.maxDiscount !== null &&
      (!Number.isFinite(this.form.maxDiscount) ||
        this.form.maxDiscount <= 0)
    ) {
      this.showMessage('error', 'Enter a valid maximum discount.');
      return;
    }

    const duplicate = this.coupons.some(coupon =>
      coupon.code.toUpperCase() === this.form.code &&
      coupon.id !== this.selectedCoupon?.id
    );

    if (duplicate) {
      this.showMessage('error', 'A coupon with this code already exists.');
      return;
    }

    const payload: Coupon = {
      ...this.form,
      code: this.form.code,
      discountValue: Number(this.form.discountValue),
      minOrderAmount: Number(this.form.minOrderAmount),
      maxDiscount:
        this.form.discountType === 'percentage'
          ? (this.form.maxDiscount === null
              ? null
              : Number(this.form.maxDiscount))
          : null
    };

    this.saving = true;

    const request = this.isEditMode && this.selectedCoupon?.id
      ? this.couponsService.updateCoupon(this.selectedCoupon.id, payload)
      : this.couponsService.addCoupon(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.showCouponModal = false;

        this.showMessage(
          'success',
          this.isEditMode
            ? 'Coupon updated successfully.'
            : 'Coupon added successfully.'
        );

        this.loadCoupons();
      },
      error: (error) => {
        console.error('Coupon save error:', error);
        this.saving = false;
        this.showMessage(
          'error',
          'Unable to save coupon. Please try again.'
        );
      }
    });
  }

  // Activate / deactivate
  toggleCouponStatus(coupon: Coupon): void {
    if (!coupon.id) return;

    this.clearMessages();

    this.couponsService.updateCoupon(coupon.id, {
      isActive: !coupon.isActive
    }).subscribe({
      next: () => {
        this.showMessage(
          'success',
          coupon.isActive
            ? 'Coupon deactivated successfully.'
            : 'Coupon activated successfully.'
        );

        this.loadCoupons();
      },
      error: (error) => {
        console.error('Coupon status update error:', error);
        this.showMessage('error', 'Unable to update coupon status.');
      }
    });
  }

  // Delete confirmation
  openDeleteConfirmation(coupon: Coupon): void {
    this.selectedCoupon = coupon;
    this.showDeleteModal = true;
    this.clearMessages();
  }

  cancelDelete(): void {
    if (this.deleting) return;

    this.showDeleteModal = false;
    this.selectedCoupon = null;
  }

  confirmDelete(): void {
    if (!this.selectedCoupon?.id) return;

    this.deleting = true;

    this.couponsService.deleteCoupon(this.selectedCoupon.id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.selectedCoupon = null;

        this.showMessage('success', 'Coupon deleted successfully.');

        this.loadCoupons();
      },
      error: (error) => {
        console.error('Coupon delete error:', error);
        this.deleting = false;
        this.showMessage('error', 'Unable to delete coupon.');
      }
    });
  }

  // Discount label
  getDiscountLabel(coupon: Coupon): string {
    return coupon.discountType === 'percentage'
      ? `${coupon.discountValue}%`
      : `₹${coupon.discountValue}`;
  }

  // Coupon status
  getCouponStatus(coupon: Coupon): string {
    if (coupon.expiryDate < this.today) return 'Expired';
    return coupon.isActive ? 'Active' : 'Inactive';
  }

  // Show message and automatically dismiss after 3 seconds
  private showMessage(
    type: 'success' | 'error',
    message: string
  ): void {
    this.clearMessageTimer();

    this.successMessage = '';
    this.errorMessage = '';

    if (type === 'success') {
      this.successMessage = message;
    } else {
      this.errorMessage = message;
    }

    this.messageTimeout = setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
      this.messageTimeout = null;
    }, this.messageDuration);
  }

  // Clear timer
  private clearMessageTimer(): void {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
  }

  // Clear messages manually
  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.clearMessageTimer();
  }

  // Clear pending timer when component is destroyed
  ngOnDestroy(): void {
    this.clearMessageTimer();
  }
}
