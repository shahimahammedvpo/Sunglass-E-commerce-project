
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { OrderService } from '../../../../core/services/order.service';
import { Order } from '../../../../core/models/order.model';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.scss'
})
export class OrderConfirmationComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  order: Order | null = null;

  loading = true;
  error = '';

  ngOnInit(): void {

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'Invalid order ID.';
      this.loading = false;
      return;
    }

    this.orderService.getOrderById(id).subscribe({

      next: (data) => {
        this.order = data;
        this.loading = false;
      },

      error: (err) => {
        console.error('Order loading error:', err);
        this.error = 'Unable to find your order.';
        this.loading = false;
      }

    });

  }

}
