
import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';
import { customerGuard } from './core/guards/customer.guard';
import { NotFoundComponent } from './features/not-found/not-found.component';

export const routes: Routes = [

  // Home
  {
    path: '',
    canActivate:[customerGuard],
    loadComponent: () =>
      import('./features/home/pages/home/home.component')
        .then(m => m.HomeComponent)
  },

  // Product Details
  {
    path: 'product/:id',
    canActivate:[customerGuard],
    loadComponent: () =>
      import('./features/products/pages/product-details/product-details.component')
        .then(m => m.ProductDetailsComponent)
  },

  // Login
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login.component')
        .then(m => m.LoginComponent)
  },

  // Register
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/register/register.component')
        .then(m => m.RegisterComponent)
  },

  // Protected Cart
  {
    path: 'cart',
    canActivate: [authGuard,customerGuard],
    loadComponent: () =>
      import('./features/cart/pages/cart/cart.component')
        .then(m => m.CartComponent)
  },

  // Protected Wishlist
  {
    path: 'wishlist',
    canActivate: [authGuard,customerGuard],
    loadComponent: () =>
      import('./features/wishlist/pages/wishlist/wishlist.component')
        .then(m => m.WishlistComponent)
  },

  // Profile
  {
    path: 'profile',
    canActivate: [authGuard,customerGuard],
    loadComponent: () =>
      import('./features/profile/pages/profile/profile.component')
        .then(m => m.ProfileComponent)
  },

  // Checkout
  {
    path: 'checkout',
    canActivate: [authGuard,customerGuard],
    loadComponent: () =>
      import('./features/checkout/pages/checkout/checkout.component')
        .then(m => m.CheckoutComponent)
  },

  // Order Confirmation
  {
    path: 'order-confirmation/:id',
    canActivate: [authGuard,customerGuard],
    loadComponent: () =>
      import('./features/orders/pages/order-confirmation/order-confirmation.component')
        .then(m => m.OrderConfirmationComponent)
  },

  // My Orders
  {
    path: 'orders',
    canActivate: [authGuard,customerGuard],
    loadComponent: () =>
      import('./features/orders/pages/my-orders/my-orders.component')
        .then(m => m.MyOrdersComponent)
  },

  // Order Details
  {
    path: 'orders/:id',
    canActivate: [authGuard,customerGuard],
    loadComponent: () =>
      import('./features/orders/pages/order-details/order-details.component')
        .then(m => m.OrderDetailsComponent)
  },

  // Track Order
  {
    path: 'track-order/:id',
    canActivate: [authGuard,customerGuard],
    loadComponent: () =>
      import('./features/orders/pages/track-order/track-order.component')
        .then(m => m.TrackOrderComponent)
  },

  // Product Listing
  {
    path: 'products',
    canActivate:[customerGuard],
    loadComponent: () =>
      import('./features/products/pages/product-listing/product-listing.component')
        .then(m => m.ProductListingComponent)
  },

  // Saved Addresses
  {
    path: 'profile/saved-addresses',
    canActivate: [authGuard,customerGuard],
    loadComponent: () =>
      import('./features/profile/pages/saved-addresses/saved-addresses.component')
        .then(m => m.SavedAddressesComponent)
  },

  // ============================================
  // ADMIN PANEL
  // ============================================

  {
    path: 'admin',
    canActivate: [adminGuard],

    loadComponent: () =>
      import('./features/admin/layout/admin-layout/admin-layout.component')
        .then(m => m.AdminLayoutComponent),

    children: [

      // Default Admin Dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },

      // Users
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/pages/users/users.component')
            .then(m => m.UsersComponent)
      },

      // Products
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/pages/products/products.component')
            .then(m => m.ProductsComponent)
      },

      // Orders
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/pages/orders/orders.component')
            .then(m => m.OrdersComponent)
      },



      // coupons
      {
        path: 'coupons',
        loadComponent: () =>
          import('./features/admin/pages/coupons/coupons.component')
            .then(m => m.CouponsComponent)
      }



    ]
  },

  // Invalid Routes
  {
    path: '**',
    component: NotFoundComponent
  }

];
