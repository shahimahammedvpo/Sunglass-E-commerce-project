
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { Store } from '@ngrx/store';

import { logout } from '../../../../store/auth/auth.actions';
import { selectCurrentUser } from '../../../../store/auth/auth.selectors';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {

  private store = inject(Store);
  private router = inject(Router);

  currentUser$ = this.store.select(selectCurrentUser);

  isSidebarOpen = false;
  showLogoutModal = false;

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  // Open logout confirmation
  logout(): void {
    this.showLogoutModal = true;
    this.closeSidebar();
  }

  // Close confirmation modal
  cancelLogout(): void {
    this.showLogoutModal = false;
  }

  // Confirm logout
  confirmLogout(): void {
    this.showLogoutModal = false;

    this.store.dispatch(logout());

    this.router.navigate(['/']);
  }
}
