
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Order } from '../../../../core/models/order.model';
import { AdminOrdersService } from '../../services/admin-orders.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit, OnDestroy {

  private ordersService = inject(AdminOrdersService);

  orders: Order[] = [];

  loading = false;
  updating = false;

  errorMessage = '';
  successMessage = '';

  // Message timeout
  private messageTimeout: ReturnType<typeof setTimeout> | null = null;
  readonly messageDuration = 3000;

  searchTerm = '';
  selectedStatus = 'all';

  currentPage = 1;
  itemsPerPage = 5;

  // Custom dropdowns
  isStatusDropdownOpen = false;

  // Order details modal
  showDetailsModal = false;
  selectedOrder: Order | null = null;

  // Status update modal
  showStatusModal = false;
  orderToUpdate: Order | null = null;
  newStatus = '';

  isUpdateStatusDropdownOpen = false;

  readonly orderStatuses = [
    'Pending',
    'Confirmed',
    'Shipped',
    'Delivered',
    'Cancelled'
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.clearMessageTimer();
  }

  // -------------------------------
  // REUSABLE MESSAGE HANDLING
  // -------------------------------

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

  private clearMessageTimer(): void {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.clearMessageTimer();
  }

  // -------------------------------
  // LOAD ORDERS
  // -------------------------------

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    this.ordersService.getAllOrders().subscribe({
      next: orders => {
        this.orders = [...orders].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

        this.loading = false;

        this.currentPage = Math.min(
          this.currentPage,
          Math.max(1, this.totalPages)
        );
      },
      error: error => {
        console.error('Unable to load orders:', error);

        this.loading = false;

        this.showMessage(
          'error',
          'Unable to load orders. Please try again.'
        );
      }
    });
  }

  // -------------------------------
  // UNIQUE CUSTOMERS
  // -------------------------------

 

  // -------------------------------
  // FILTER ORDERS
  // -------------------------------

  get filteredOrders(): Order[] {

    const search = this.searchTerm.trim().toLowerCase();

    return this.orders.filter(order => {

      const orderId = String(order.id ?? '');
      const orderNumber = String(order.orderNumber ?? '');

      const matchesSearch =
        !search ||
        orderId.toLowerCase().includes(search) ||
        orderNumber.toLowerCase().includes(search) ||
        order.customerName.toLowerCase().includes(search) ||
        order.email.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'all' ||
        order.status.toLowerCase() === this.selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;

    });

  }

  // -------------------------------
  // ORDER SUMMARY
  // -------------------------------

  get totalOrders(): number {
    return this.orders.length;
  }

  get pendingOrders(): number {
    return this.orders.filter(
      order => order.status.toLowerCase() === 'pending'
    ).length;
  }

  get deliveredOrders(): number {
    return this.orders.filter(
      order => order.status.toLowerCase() === 'delivered'
    ).length;
  }

  get cancelledOrders(): number {
    return this.orders.filter(
      order => order.status.toLowerCase() === 'cancelled'
    ).length;
  }

  // -------------------------------
  // PAGINATION
  // -------------------------------

  get totalPages(): number {
    return Math.ceil(
      this.filteredOrders.length / this.itemsPerPage
    );
  }

  get paginatedOrders(): Order[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;

    return this.filteredOrders.slice(
      start,
      start + this.itemsPerPage
    );
  }

  get pageNumbers(): number[] {
    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }

  get startItem(): number {
    return this.filteredOrders.length === 0
      ? 0
      : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredOrders.length
    );
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    this.changePage(this.currentPage - 1);
  }

  nextPage(): void {
    this.changePage(this.currentPage + 1);
  }

  // -------------------------------
  // CUSTOM STATUS FILTER
  // -------------------------------

  toggleStatusDropdown(): void {
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
    
  }

  selectStatus(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.closeAllDropdowns();
  }

  // -------------------------------
  // CUSTOM CUSTOMER FILTER
  // -------------------------------

  closeAllDropdowns(): void {
    this.isStatusDropdownOpen = false;
    
  }
  // -------------------------------
  // ORDER DETAILS MODAL
  // -------------------------------

  openOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.showDetailsModal = true;
  }

  closeOrderDetails(): void {
    this.showDetailsModal = false;
    this.selectedOrder = null;
  }

  // -------------------------------
  // UPDATE ORDER STATUS
  // -------------------------------

  openStatusModal(order: Order): void {
    if (order.status.toLowerCase() === 'cancelled') {
      return;
    }

    this.orderToUpdate = order;
    this.newStatus = order.status;
    this.showStatusModal = true;
    this.isUpdateStatusDropdownOpen = false;
    this.errorMessage = '';
  }

  closeStatusModal(): void {
    if (this.updating) return;

    this.showStatusModal = false;
    this.orderToUpdate = null;
    this.newStatus = '';
    this.isUpdateStatusDropdownOpen = false;
    this.errorMessage = '';
  }

  confirmStatusUpdate(): void {
    if (!this.orderToUpdate?.id || !this.newStatus) {
      return;
    }

    if (this.newStatus === this.orderToUpdate.status) {
      this.closeStatusModal();
      return;
    }

    this.updating = true;
    this.errorMessage = '';

    this.ordersService.updateOrderStatus(
      this.orderToUpdate.id,
      this.newStatus
    ).subscribe({
      next: updatedOrder => {
        this.orders = this.orders.map(order =>
          order.id === updatedOrder.id
            ? { ...order, ...updatedOrder }
            : order
        );

        this.updating = false;
        this.showStatusModal = false;
        this.orderToUpdate = null;
        this.newStatus = '';

        this.showMessage(
          'success',
          'Order status updated successfully.'
        );
      },
      error: error => {
        console.error('Unable to update order status:', error);

        this.updating = false;

        this.showMessage(
          'error',
          'Unable to update order status. Please try again.'
        );
      }
    });
  }

  // -------------------------------
  // ORDER DISPLAY NUMBER
  // -------------------------------

  getOrderDisplayNumber(order: Order): string {
    return order.orderNumber != null
      ? `#${order.orderNumber}`
      : `#${order.id ?? ''}`;
  }

  // -------------------------------
  // STATUS UPDATE DROPDOWN
  // -------------------------------

  toggleUpdateStatusDropdown(): void {
    this.isUpdateStatusDropdownOpen =
      !this.isUpdateStatusDropdownOpen;
  }

  selectNewStatus(status: string): void {
    this.newStatus = status;
    this.isUpdateStatusDropdownOpen = false;
  }

  closeUpdateStatusDropdown(): void {
    this.isUpdateStatusDropdownOpen = false;
  }
}
