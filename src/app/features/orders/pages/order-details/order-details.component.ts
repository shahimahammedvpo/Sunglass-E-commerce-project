
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { OrderService } from '../../../../core/services/order.service';
import { Order } from '../../../../core/models/order.model';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.scss'
})
export class OrderDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  order: Order | null = null;

  loading = true;
  errorMessage = '';

  ngOnInit(): void {

    // Get database ID from route
    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'Invalid order ID.';
      this.loading = false;
      return;
    }

    // Fetch order using database ID
    this.orderService.getOrderById(id).subscribe({

      next: (data) => {

        const user = this.authService.getCurrentUser();

        // Verify order ownership
        if (!user || data.customerId !== user.id) {
          this.errorMessage = 'Order not found.';
          this.loading = false;
          return;
        }

        this.order = data;
        this.loading = false;

      },

      error: (err) => {
        console.error('Unable to load order:', err);
        this.errorMessage = 'Order details could not be loaded.';
        this.loading = false;
      }

    });

  }

}
