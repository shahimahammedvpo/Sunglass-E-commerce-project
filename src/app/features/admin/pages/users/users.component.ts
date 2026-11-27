
import {
  Component,
  OnInit,
  DestroyRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  AdminUsersService,
  AdminUser
} from '../../services/admin-users.service';

import {
  AdminOrdersService
} from '../../services/admin-orders.service';

import { Order } from '../../../../core/models/order.model';

import { ToastService } from '../../../../core/services/toast.service';

import { Store } from '@ngrx/store';

import {
  selectCurrentUser
} from '../../../../store/auth/auth.selectors';

@Component({
  selector: 'app-users',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {

  private usersService = inject(AdminUsersService);
  private ordersService = inject(AdminOrdersService);
  private toastService = inject(ToastService);
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  // ========================================
  // USERS DATA
  // ========================================

  users: AdminUser[] = [];

  loading = true;

  errorMessage = '';

  // ========================================
  // CURRENT ADMIN
  // ========================================

  currentAdminId: number | null = null;

  // ========================================
  // SEARCH AND FILTER
  // ========================================

  currentPage = 1;

  itemsPerPage = 5;

  private _searchTerm = '';

  private _selectedFilter = 'all';

  get searchTerm(): string {
    return this._searchTerm;
  }

  set searchTerm(value: string) {
    this._searchTerm = value;
    this.currentPage = 1;
  }

  get selectedFilter(): string {
    return this._selectedFilter;
  }

  set selectedFilter(value: string) {
    this._selectedFilter = value;
    this.currentPage = 1;
  }

  // ========================================
  // CONFIRMATION MODAL
  // ========================================

  showConfirmModal = false;

  selectedUser: AdminUser | null = null;

  pendingBlockedState: boolean | null = null;

  isUpdating = false;

  // ========================================
  // CUSTOMER DETAILS AND ORDER HISTORY
  // ========================================

  showUserDetailsModal = false;

  selectedDetailsUser: AdminUser | null = null;

  userOrders: Order[] = [];

  loadingUserOrders = false;

  ordersError = '';

  // ========================================
  // CUSTOM FILTER DROPDOWN
  // ========================================

  isFilterDropdownOpen = false;

  // ========================================
  // LIFECYCLE
  // ========================================

  ngOnInit(): void {

    this.store.select(selectCurrentUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {

        this.currentAdminId = user?.id ?? null;

      });

    this.loadUsers();

  }

  // ========================================
  // LOAD USERS
  // ========================================

  loadUsers(): void {

    this.loading = true;
    this.errorMessage = '';

    this.usersService.getCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({

        next: users => {

          this.users = users;

          this.currentPage = Math.min(
            this.currentPage,
            Math.max(1, this.totalPages)
          );

          this.loading = false;

        },

        error: error => {

          console.error('Users loading error:', error);

          this.errorMessage =
            'Unable to load users. Please check whether JSON Server is running.';

          this.loading = false;

        }

      });

  }

  // ========================================
  // FILTERED USERS
  // ========================================

  get filteredUsers(): AdminUser[] {

    const search = this.searchTerm
      .trim()
      .toLowerCase();

    return this.users.filter(user => {

      const matchesSearch =
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);

      const matchesFilter =
        this.selectedFilter === 'all' ||

        (
          this.selectedFilter === 'active' &&
          user.isBlocked !== true
        ) ||

        (
          this.selectedFilter === 'blocked' &&
          user.isBlocked === true
        );

      return matchesSearch && matchesFilter;

    });

  }

  // ========================================
  // CUSTOMER COUNTS
  // ========================================

  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {

    return this.users.filter(
      user => user.isBlocked !== true
    ).length;

  }

  get blockedUsers(): number {

    return this.users.filter(
      user => user.isBlocked === true
    ).length;

  }

  // ========================================
  // PAGINATION
  // ========================================

  get totalPages(): number {

    return Math.ceil(
      this.filteredUsers.length / this.itemsPerPage
    );

  }

  get paginatedUsers(): AdminUser[] {

    const startIndex =
      (this.currentPage - 1) * this.itemsPerPage;

    return this.filteredUsers.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );

  }

  get pageNumbers(): number[] {

    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );

  }

  get startItem(): number {

    return this.filteredUsers.length === 0
      ? 0
      : (this.currentPage - 1) * this.itemsPerPage + 1;

  }

  get endItem(): number {

    return Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredUsers.length
    );

  }

  changePage(page: number): void {

    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;

  }

  previousPage(): void {
    this.changePage(this.currentPage - 1);
  }

  nextPage(): void {
    this.changePage(this.currentPage + 1);
  }

  // ========================================
  // VIEW CUSTOMER DETAILS AND ORDERS
  // ========================================

  openUserDetails(user: AdminUser): void {

    this.selectedDetailsUser = user;

    this.userOrders = [];

    this.ordersError = '';

    this.loadingUserOrders = true;

    this.showUserDetailsModal = true;

    this.ordersService.getAllOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({

        next: orders => {

          this.userOrders = orders
            .filter(order => order.customerId === user.id)
            .sort((a, b) => {

              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();

              return dateB - dateA;

            });

          this.loadingUserOrders = false;

        },

        error: error => {

          console.error('Customer orders loading error:', error);

          this.ordersError =
            'Unable to load customer orders. Please try again.';

          this.loadingUserOrders = false;

        }

      });

  }

  // ========================================
  // CLOSE CUSTOMER DETAILS MODAL
  // ========================================

  closeUserDetails(): void {

    this.showUserDetailsModal = false;

    this.selectedDetailsUser = null;

    this.userOrders = [];

    this.ordersError = '';

    this.loadingUserOrders = false;

  }

  // ========================================
  // GET ORDER DISPLAY NUMBER
  // ========================================

  getOrderDisplayNumber(order: Order): string {

    return `#${order.orderNumber ?? order.id ?? 'N/A'}`;

  }

  // ========================================
  // OPEN BLOCK / UNBLOCK CONFIRMATION
  // ========================================

  openBlockConfirmation(user: AdminUser): void {

    if (user.id === this.currentAdminId) {

      this.toastService.info(
        'You cannot block your own admin account.'
      );

      return;

    }

    this.selectedUser = user;

    this.pendingBlockedState = user.isBlocked !== true;

    this.showConfirmModal = true;

  }

  // ========================================
  // CANCEL CONFIRMATION
  // ========================================

  cancelConfirmation(): void {

    if (this.isUpdating) {
      return;
    }

    this.showConfirmModal = false;

    this.selectedUser = null;

    this.pendingBlockedState = null;

  }

  // ========================================
  // CONFIRM BLOCK / UNBLOCK
  // ========================================

  confirmBlockAction(): void {

    if (
      !this.selectedUser ||
      this.pendingBlockedState === null ||
      this.isUpdating
    ) {
      return;
    }

    const user = this.selectedUser;

    const blockedState = this.pendingBlockedState;

    this.isUpdating = true;

    this.usersService.updateBlockStatus(
      user.id,
      blockedState
    ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({

        next: () => {

          this.users = this.users.map(item =>
            item.id === user.id
              ? { ...item, isBlocked: blockedState }
              : item
          );

          this.isUpdating = false;

          this.showConfirmModal = false;

          this.selectedUser = null;

          this.pendingBlockedState = null;

          if (blockedState) {

            this.toastService.success(
              `${user.fullName} has been blocked successfully.`
            );

          } else {

            this.toastService.success(
              `${user.fullName} has been unblocked successfully.`
            );

          }

        },

        error: error => {

          console.error('User status update error:', error);

          this.isUpdating = false;

          this.errorMessage =
            'Unable to update user status. Please try again.';

        }

      });

  }

  // ========================================
  // CUSTOM FILTER DROPDOWN
  // ========================================

  toggleFilterDropdown(): void {

    this.isFilterDropdownOpen = !this.isFilterDropdownOpen;

  }

  closeFilterDropdown(): void {

    this.isFilterDropdownOpen = false;

  }

  selectFilter(filter: 'all' | 'active' | 'blocked'): void {

    this.selectedFilter = filter;

    this.currentPage = 1;

    this.isFilterDropdownOpen = false;

  }

}
