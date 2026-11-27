import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Order } from '../../../../core/models/order.model';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './track-order.component.html',
  styleUrl: './track-order.component.scss'
})
export class TrackOrderComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  order: Order | null = null;

  loading = true;
  errorMessage = '';

  trackingStages = [
    'Pending',
    'Confirmed',
    'Shipped',
    'Delivered'
  ];

  ngOnInit(): void {

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'Invalid order ID.';
      this.loading = false;
      return;
    }

    this.orderService.getOrderById(id).subscribe({

      next: (data) => {

        const user = this.authService.getCurrentUser();

        if (!user || user.id === undefined || data.customerId !== user.id) {
          this.errorMessage = 'Order not found.';
          this.loading = false;
          return;
        }

        this.order = data;
        this.loading = false;

      },

      error: (err) => {
        console.error('Unable to load order:', err);
        this.errorMessage = 'Unable to track this order.';
        this.loading = false;
      }

    });

  }

  get currentStageIndex(): number {

    if (!this.order) {
      return -1;
    }

    return this.trackingStages.indexOf(this.order.status);

  }

  isStageCompleted(stage: string): boolean {

    if (!this.order || this.order.status === 'Cancelled') {
      return false;
    }

    const stageIndex = this.trackingStages.indexOf(stage);

    return stageIndex <= this.currentStageIndex;

  }

}