
import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import { AuthState } from './auth.state';

// ============================================
// AUTH FEATURE SELECTOR
// ============================================

export const selectAuthState =
  createFeatureSelector<AuthState>('auth');

// ============================================
// CURRENT USER
// ============================================

export const selectCurrentUser = createSelector(
  selectAuthState,
  state => state.currentUser
);

// ============================================
// AUTHENTICATION STATUS
// ============================================

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  state => state.isAuthenticated
);

// ============================================
// ADMIN ROLE
// ============================================

export const selectIsAdmin = createSelector(
  selectCurrentUser,
  user => user?.role === 'admin'
);

// ============================================
// CUSTOMER ROLE
// ============================================

export const selectIsCustomer = createSelector(
  selectCurrentUser,
  user => user?.role === 'customer'
);

// ============================================
// BLOCK STATUS
// ============================================

export const selectIsBlocked = createSelector(
  selectCurrentUser,
  user => user?.isBlocked === true
);

// ============================================
// LOADING STATE
// ============================================

export const selectAuthLoading = createSelector(
  selectAuthState,
  state => state.loading
);

// ============================================
// AUTH ERROR
// ============================================

export const selectAuthError = createSelector(
  selectAuthState,
  state => state.error
);

// ============================================
// USER NAME
// ============================================

export const selectUserName = createSelector(
  selectCurrentUser,
  user => user?.fullName ?? ''
);

// ============================================
// USER EMAIL
// ============================================

export const selectUserEmail = createSelector(
  selectCurrentUser,
  user => user?.email ?? ''
);

// ============================================
// USER PROFILE IMAGE
// ============================================

export const selectUserProfileImage = createSelector(
  selectCurrentUser,
  user => user?.profileImage ?? ''
);

// ============================================
// AUTH GUARD STATUS
// ============================================

export const selectAuthGuardStatus = createSelector(
  selectAuthState,
  state => ({
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    currentUser: state.currentUser
  })
);
