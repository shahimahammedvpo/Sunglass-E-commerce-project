import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { OrderService } from '../../../../core/services/order.service';

import { Order } from '../../../../core/models/order.model';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.scss'
})
export class MyOrdersComponent implements OnInit,OnDestroy {

  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private successMessageTimeout: ReturnType<typeof setTimeout> | null = null;

  orders: Order[] = [];

  loading = true;

  errorMessage = '';

  successMessage = '';


  // --------------------------------------------------
  // CANCELLATION MODAL
  // --------------------------------------------------

  showCancelModal = false;

  selectedOrder: Order | null = null;

  cancellingOrder = false;


  // Cancellation reason
cancellationReason = '';

cancellationComments = '';

  // --------------------------------------------------
  // INIT
  // --------------------------------------------------

  ngOnInit(): void {
    this.loadOrders();
  }


  // destroy
  ngOnDestroy(): void {

  if (this.successMessageTimeout) {
    clearTimeout(this.successMessageTimeout);
  }

}


  // --------------------------------------------------
  // LOAD ORDERS
  // --------------------------------------------------

  loadOrders(): void {

    const user = this.authService.getCurrentUser();

    if (!user) {

      this.loading = false;

      this.errorMessage =
        'Please log in to view your orders.';

      return;

    }

    this.loading = true;

    this.errorMessage = '';

    this.orderService
      .getOrdersByCustomer(user.id)
      .subscribe({

        next: (data) => {

          this.orders = data.sort((a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );

          this.loading = false;

        },

        error: (err) => {

          console.error(
            'Unable to load orders:',
            err
          );

          this.errorMessage =
            'Unable to load your orders.';

          this.loading = false;

        }

      });

  }


  // --------------------------------------------------
  // OPEN CANCELLATION MODAL
  // --------------------------------------------------

  cancelOrder(order: Order): void {

    if (!order.orderNumber || order.status !== 'Pending') {
      return;
    }

    this.selectedOrder = order;

    this.cancellationReason = '';

    this.cancellationComments = '';

    this.showCancelModal = true;

    this.errorMessage = '';

    this.successMessage = '';

  }


  // --------------------------------------------------
  // CLOSE CANCELLATION MODAL
  // --------------------------------------------------

  closeCancelModal(): void {

    if (this.cancellingOrder) {
      return;
    }

    this.showCancelModal = false;

    this.selectedOrder = null;

    this.cancellationReason = '';

    this.cancellationComments = '';

  }
// timeout
  showSuccessMessage(message: string): void {
  this.successMessage = message;

  // Clear any previous timeout
  if (this.successMessageTimeout) {
    clearTimeout(this.successMessageTimeout);
  }

  // Automatically hide the message after 5 seconds
  this.successMessageTimeout = setTimeout(() => {
    this.successMessage = '';
  }, 5000);
}
  // --------------------------------------------------
  // CONFIRM CANCELLATION
  // --------------------------------------------------

  confirmCancellation(): void {

  if (
    !this.selectedOrder ||
    this.cancellingOrder
  ) {
    return;
  }

  const order = this.selectedOrder;

  if (order.id === undefined || order.id === null) {

    this.errorMessage = 'Invalid order ID.';

    return;

  }

  this.cancellingOrder = true;

  this.errorMessage = '';

  this.successMessage = '';

  this.orderService
    .cancelOrder(
      order.id,
      this.cancellationReason,
      this.cancellationComments
    )
    .subscribe({

      next: (updatedOrder) => {

        order.status = 'Cancelled';

        order.cancellationReason =
          updatedOrder.cancellationReason;

        order.cancellationComments =
          updatedOrder.cancellationComments;

        order.cancelledAt =
          updatedOrder.cancelledAt;

        // Show success message for 5 seconds
        this.showSuccessMessage(
          `Order #${order.orderNumber} has been cancelled successfully.`
        );

        this.showCancelModal = false;

        this.selectedOrder = null;

        this.cancellationReason = '';

        this.cancellationComments = '';

        this.cancellingOrder = false;

      },

      error: (err) => {

        console.error(
          'Cancellation failed:',
          err
        );

        this.errorMessage =
          'Unable to cancel this order. Please try again.';

        this.cancellingOrder = false;

      }

    });

}

}