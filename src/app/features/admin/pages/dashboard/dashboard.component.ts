
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  AdminDashboardService,
  AdminDashboardOrder,
  AdminDashboardProduct
} from '../../services/admin-dashboard.service';

interface TrendData {
  label: string;
  revenue: number;
  orders: number;
  x: number;
  revenueY: number;
  orderY: number;
}

interface StatusData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface ProductData {
  name: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

interface CategoryData {
  name: string;
  quantity: number;
  revenue: number;
  percentage: number;
  color: string;
}

interface DashboardOrder extends AdminDashboardOrder {
  orderNumber?: number;
}

interface LowStockProduct extends AdminDashboardProduct {
  stock: number;
}

interface PeriodTotals {
  revenue: number;
  orders: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  private dashboardService = inject(AdminDashboardService);

  loading = true;
  errorMessage = '';

  // SUMMARY
  totalUsers = 0;
  totalProducts = 0;
  totalOrders = 0;
  totalRevenue = 0;

  // CUSTOMER ANALYTICS
  purchasingCustomers = 0;
  repeatCustomers = 0;

  // REVENUE AND ORDER TRENDS
  trendData: TrendData[] = [];
  selectedTrendPeriod: 'week' | 'month' | 'year' = 'month';

  private dashboardOrders: AdminDashboardOrder[] = [];

  // CHART TOOLTIP
  hoveredTrend: TrendData | null = null;

  // PERIOD COMPARISON
  revenueChangePercent: number | null = 0;
  ordersChangePercent: number | null = 0;

  // ORDER STATUS
  orderStatuses: StatusData[] = [];
  statusGradient = 'conic-gradient(#e9edf3 0deg 360deg)';

  // PRODUCTS AND CATEGORIES
  topProducts: ProductData[] = [];
  categories: CategoryData[] = [];

  // RECENT ORDERS
  recentOrders: DashboardOrder[] = [];

  // LOW STOCK PRODUCTS
  lowStockProducts: LowStockProduct[] = [];
  readonly lowStockLimit = 5;

  ngOnInit(): void {
    this.loadDashboard();
  }

  // ========================================
  // LOAD DASHBOARD
  // ========================================

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.dashboardService.getDashboardData().subscribe({

      next: data => {

        const customers = data.users.filter(
          user => user.role !== 'admin'
        );

        this.totalUsers = customers.length;
        this.totalProducts = data.products.length;
        this.totalOrders = data.orders.length;

        this.dashboardOrders = data.orders;

        const validOrders = data.orders.filter(
          order => !this.isCancelled(order)
        );

        this.calculateRevenue(validOrders);
        this.calculateTrendData(data.orders);
        this.calculateOrderStatuses(data.orders);
        this.calculateTopProducts(data.orders);
        this.calculateCategories(data.orders, data.products);
        this.calculateCustomerAnalytics(customers, data.orders);

        this.calculateRecentOrders(data.orders);
        this.calculateLowStockProducts(data.products);

        this.loading = false;
      },

      error: error => {

        console.error('Dashboard loading error:', error);

        this.errorMessage =
          'Unable to load dashboard data. Please check whether JSON Server is running.';

        this.loading = false;
      }

    });
  }

  // ========================================
  // COMMON HELPERS
  // ========================================

  private isCancelled(order: AdminDashboardOrder): boolean {
    return (order.status || '').toLowerCase() === 'cancelled';
  }

  private getOrderAmount(order: AdminDashboardOrder): number {

    const amount = Number(order.totalAmount);

    return Number.isFinite(amount) ? amount : 0;
  }

  private getQuantity(item: any): number {

    const quantity = Number(item.quantity);

    return Number.isFinite(quantity) && quantity > 0
      ? quantity
      : 0;
  }

  private getItemName(item: any): string {

    return (
      item.product?.name ||
      item.name ||
      item.productName ||
      'Unknown Product'
    );
  }

  private getItemPrice(item: any): number {

    const price = Number(item.product?.price ?? item.price);

    return Number.isFinite(price) ? price : 0;
  }

  // ========================================
  // REVENUE
  // ========================================

  private calculateRevenue(orders: AdminDashboardOrder[]): void {

    this.totalRevenue = orders.reduce(
      (total, order) => total + this.getOrderAmount(order),
      0
    );
  }

  // ========================================
  // TREND FILTER
  // ========================================

  onTrendPeriodChange(
    period: 'week' | 'month' | 'year'
  ): void {

    this.selectedTrendPeriod = period;
    this.hoveredTrend = null;

    this.calculateTrendData(this.dashboardOrders);
  }

  get trendDescription(): string {

    switch (this.selectedTrendPeriod) {

      case 'week':
        return 'Daily revenue and orders over the last 7 days';

      case 'month':
        return 'Weekly revenue and orders over the last 30 days';

      case 'year':
        return 'Monthly revenue and orders over the last 12 months';
    }
  }

  // ========================================
  // REVENUE AND ORDER LINE GRAPH
  // ========================================

  private calculateTrendData(
    orders: AdminDashboardOrder[]
  ): void {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets: {
      label: string;
      start: Date;
      end: Date;
      revenue: number;
      orders: number;
    }[] = [];

    if (this.selectedTrendPeriod === 'week') {

      // Last 7 days

      for (let i = 6; i >= 0; i--) {

        const start = new Date(today);
        start.setDate(today.getDate() - i);

        const end = new Date(start);
        end.setDate(start.getDate() + 1);

        buckets.push({
          label: start.toLocaleDateString('en-IN', {
            weekday: 'short'
          }),
          start,
          end,
          revenue: 0,
          orders: 0
        });
      }

    } else if (this.selectedTrendPeriod === 'month') {

      // Last 30 days grouped into weeks

      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - 29);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      for (let i = 0; i < 30; i += 7) {

        const start = new Date(firstDay);
        start.setDate(firstDay.getDate() + i);

        const end = new Date(start);
        end.setDate(start.getDate() + 7);

        const bucketEnd = end < tomorrow ? end : tomorrow;

        const lastDay = new Date(bucketEnd);
        lastDay.setDate(bucketEnd.getDate() - 1);

        buckets.push({
          label: `${start.getDate()}–${lastDay.getDate()} ${lastDay.toLocaleDateString('en-IN', {
            month: 'short'
          })}`,
          start,
          end: bucketEnd,
          revenue: 0,
          orders: 0
        });
      }

    } else {

      // Last 12 months

      for (let i = 11; i >= 0; i--) {

        const start = new Date(
          today.getFullYear(),
          today.getMonth() - i,
          1
        );

        const end = new Date(
          start.getFullYear(),
          start.getMonth() + 1,
          1
        );

        buckets.push({
          label: start.toLocaleDateString('en-IN', {
            month: 'short',
            year: '2-digit'
          }),
          start,
          end,
          revenue: 0,
          orders: 0
        });
      }
    }

    // Assign orders to their matching date range

    orders.forEach(order => {

      if (!order.createdAt) return;

      const orderDate = new Date(order.createdAt);

      if (Number.isNaN(orderDate.getTime())) return;

      const bucket = buckets.find(item =>
        orderDate >= item.start &&
        orderDate < item.end
      );

      if (!bucket) return;

      // Count all placed orders, including cancelled orders.
      bucket.orders++;

      // Cancelled orders do not contribute to revenue.
      if (!this.isCancelled(order)) {
        bucket.revenue += this.getOrderAmount(order);
      }
    });

    // Independent visual scales:
    // These are visual trend lines, not a shared numerical axis.

    const maxRevenue = Math.max(
      ...buckets.map(item => item.revenue),
      1
    );

    const maxOrders = Math.max(
      ...buckets.map(item => item.orders),
      1
    );

    const chartWidth = 590;
    const chartTop = 25;
    const chartBottom = 165;
    const chartHeight = chartBottom - chartTop;

    this.trendData = buckets.map((item, index) => {

      const x = buckets.length === 1
        ? 35 + chartWidth / 2
        : 35 + (index / (buckets.length - 1)) * chartWidth;

      const revenueY =
        chartBottom - (item.revenue / maxRevenue) * chartHeight;

      const orderY =
        chartBottom - (item.orders / maxOrders) * chartHeight;

      return {
        label: item.label,
        revenue: item.revenue,
        orders: item.orders,
        x,
        revenueY,
        orderY
      };
    });

    this.calculatePeriodComparison();
  }

  get revenueLinePoints(): string {

    return this.trendData
      .map(item => `${item.x},${item.revenueY}`)
      .join(' ');
  }

  get orderLinePoints(): string {

    return this.trendData
      .map(item => `${item.x},${item.orderY}`)
      .join(' ');
  }

  get revenueAreaPath(): string {

    if (!this.trendData.length) return '';

    const first = this.trendData[0];
    const last = this.trendData[this.trendData.length - 1];

    const linePoints = this.trendData
      .map(item => `${item.x},${item.revenueY}`)
      .join(' L ');

    return `M ${first.x},165 L ${linePoints} L ${last.x},165 Z`;
  }

  // ========================================
  // CHART TOOLTIP
  // ========================================

  showTrendTooltip(item: TrendData): void {
    this.hoveredTrend = item;
  }

  hideTrendTooltip(): void {
    this.hoveredTrend = null;
  }

  getTooltipLeft(item: TrendData): number {

    return Math.min(
      90,
      Math.max(10, (item.x / 650) * 100)
    );
  }

  getTooltipTop(item: TrendData): number {

    return Math.max(
      5,
      Math.min(item.revenueY, item.orderY) - 65
    );
  }

  // ========================================
  // PERIOD COMPARISON
  // ========================================

  private calculatePeriodComparison(): void {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStart: Date;
    let previousStart: Date;

    const currentEnd = new Date(today);
    currentEnd.setDate(currentEnd.getDate() + 1);

    if (this.selectedTrendPeriod === 'week') {

      currentStart = new Date(today);
      currentStart.setDate(today.getDate() - 6);

      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);

    } else if (this.selectedTrendPeriod === 'month') {

      currentStart = new Date(today);
      currentStart.setDate(today.getDate() - 29);

      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 30);

    } else {

      currentStart = new Date(
        today.getFullYear(),
        today.getMonth() - 11,
        1
      );

      previousStart = new Date(
        currentStart.getFullYear(),
        currentStart.getMonth() - 12,
        1
      );
    }

    const current = this.getPeriodTotals(
      currentStart,
      currentEnd
    );

    const previous = this.getPeriodTotals(
      previousStart,
      currentStart
    );

    this.revenueChangePercent = this.getPercentageChange(
      current.revenue,
      previous.revenue
    );

    this.ordersChangePercent = this.getPercentageChange(
      current.orders,
      previous.orders
    );
  }

  private getPeriodTotals(
    start: Date,
    end: Date
  ): PeriodTotals {

    const matchingOrders = this.dashboardOrders.filter(order => {

      if (!order.createdAt) return false;

      const date = new Date(order.createdAt);

      return !Number.isNaN(date.getTime()) &&
        date >= start &&
        date < end;
    });

    return {

      orders: matchingOrders.length,

      revenue: matchingOrders
        .filter(order => !this.isCancelled(order))
        .reduce(
          (total, order) => total + this.getOrderAmount(order),
          0
        )
    };
  }

  private getPercentageChange(
    current: number,
    previous: number
  ): number | null {

    if (previous === 0) {
      return current === 0 ? 0 : null;
    }

    return ((current - previous) / previous) * 100;
  }

  // ========================================
  // ORDER STATUS DISTRIBUTION
  // ========================================

  private calculateOrderStatuses(
    orders: AdminDashboardOrder[]
  ): void {

    const colors: Record<string, string> = {
      pending: '#e9a23b',
      confirmed: '#4d91e8',
      shipped: '#8b72d9',
      delivered: '#36a779',
      cancelled: '#e36b6b'
    };

    const counts: Record<string, number> = {};

    orders.forEach(order => {

      const status = (order.status || 'unknown').toLowerCase();

      counts[status] = (counts[status] || 0) + 1;
    });

    const total = orders.length || 1;

    this.orderStatuses = Object.entries(counts).map(
      ([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        percentage: (count / total) * 100,
        color: colors[name] || '#9299a8'
      })
    );

    let angle = 0;

    const gradients = this.orderStatuses.map(status => {

      const start = angle;
      angle += status.percentage * 3.6;

      return `${status.color} ${start}deg ${angle}deg`;
    });

    this.statusGradient = gradients.length
      ? `conic-gradient(${gradients.join(', ')})`
      : 'conic-gradient(#e9edf3 0deg 360deg)';
  }

  // ========================================
  // TOP SELLING PRODUCTS
  // ========================================

  private calculateTopProducts(
    orders: AdminDashboardOrder[]
  ): void {

    const products = new Map<
      string,
      { quantity: number; revenue: number }
    >();

    orders
      .filter(order => !this.isCancelled(order))
      .forEach(order => {

        (order.items || []).forEach(item => {

          const name = this.getItemName(item);
          const quantity = this.getQuantity(item);
          const revenue = this.getItemPrice(item) * quantity;

          const existing = products.get(name) || {
            quantity: 0,
            revenue: 0
          };

          products.set(name, {
            quantity: existing.quantity + quantity,
            revenue: existing.revenue + revenue
          });
        });
      });

    const sorted = Array.from(products.entries())
      .map(([name, value]) => ({
        name,
        ...value
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const maxQuantity = Math.max(
      ...sorted.map(item => item.quantity),
      1
    );

    this.topProducts = sorted.map(item => ({
      ...item,
      percentage: (item.quantity / maxQuantity) * 100
    }));
  }

  // ========================================
  // CATEGORY PERFORMANCE
  // ========================================

  private calculateCategories(
    orders: AdminDashboardOrder[],
    products: AdminDashboardProduct[]
  ): void {

    const productMap = new Map(
      products.map(product => [product.id, product])
    );

    const categoryMap = new Map<
      string,
      { quantity: number; revenue: number }
    >();

    orders
      .filter(order => !this.isCancelled(order))
      .forEach(order => {

        (order.items || []).forEach(item => {

          const productId = item.product?.id;

          const catalogProduct = productId != null
            ? productMap.get(Number(productId))
            : undefined;

          const category =
            item.product?.category ||
            catalogProduct?.category ||
            'Other';

          const quantity = this.getQuantity(item);
          const revenue = this.getItemPrice(item) * quantity;

          const existing = categoryMap.get(category) || {
            quantity: 0,
            revenue: 0
          };

          categoryMap.set(category, {
            quantity: existing.quantity + quantity,
            revenue: existing.revenue + revenue
          });
        });
      });

    const result = Array.from(categoryMap.entries()).map(
      ([name, value]) => ({
        name,
        ...value
      })
    );

    const maxRevenue = Math.max(
      ...result.map(item => item.revenue),
      1
    );

    const colors: Record<string, string> = {
      Men: '#c0914c',
      Women: '#d58ca4',
      Unisex: '#6c91c9',
      Other: '#9299a8'
    };

    this.categories = result
      .sort((a, b) => b.revenue - a.revenue)
      .map(item => ({
        ...item,
        percentage: (item.revenue / maxRevenue) * 100,
        color: colors[item.name] || '#9299a8'
      }));
  }

  // ========================================
  // CUSTOMER ANALYTICS
  // ========================================

  private calculateCustomerAnalytics(
    customers: { id: number }[],
    orders: AdminDashboardOrder[]
  ): void {

    const customerIds = new Set(
      customers.map(customer => Number(customer.id))
    );

    const customerOrderCounts = new Map<number, number>();

    orders
      .filter(order => !this.isCancelled(order))
      .forEach(order => {

        if (order.customerId == null) return;

        const customerId = Number(order.customerId);

        if (!customerIds.has(customerId)) return;

        customerOrderCounts.set(
          customerId,
          (customerOrderCounts.get(customerId) || 0) + 1
        );
      });

    this.purchasingCustomers = customerOrderCounts.size;

    this.repeatCustomers = Array.from(
      customerOrderCounts.values()
    ).filter(count => count > 1).length;
  }

  // ========================================
  // RECENT ORDERS
  // ========================================

  private calculateRecentOrders(
    orders: AdminDashboardOrder[]
  ): void {

    this.recentOrders = [...orders]
      .sort((a, b) => {

        const dateA = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

        const dateB = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return dateB - dateA;
      })
      .slice(0, 5) as DashboardOrder[];
  }

  getOrderDisplayNumber(order: DashboardOrder): string {

    return order.orderNumber != null
      ? `#${order.orderNumber}`
      : `#${order.id}`;
  }

  formatOrderDate(date?: string): string {

    if (!date) return 'Date unavailable';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable';
    }

    return parsedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getStatusClass(status?: string): string {

    switch ((status || '').toLowerCase()) {

      case 'pending':
        return 'status-pending';

      case 'confirmed':
        return 'status-confirmed';

      case 'shipped':
        return 'status-shipped';

      case 'delivered':
        return 'status-delivered';

      case 'cancelled':
        return 'status-cancelled';

      default:
        return 'status-default';
    }
  }

  // ========================================
  // LOW STOCK PRODUCTS
  // ========================================

  private calculateLowStockProducts(
    products: AdminDashboardProduct[]
  ): void {

    this.lowStockProducts = products
      .filter(product => {

        const stock = Number(product.stock ?? 0);

        return Number.isFinite(stock) &&
          stock >= 0 &&
          stock <= this.lowStockLimit;
      })
      .map(product => ({
        ...product,
        stock: Number(product.stock ?? 0)
      }))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);
  }

  // ========================================
  // FORMATTING
  // ========================================

  formatCurrency(value: number): string {

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }
}
