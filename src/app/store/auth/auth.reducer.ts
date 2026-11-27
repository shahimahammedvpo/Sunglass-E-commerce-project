
import { createReducer, on } from '@ngrx/store';

import * as AuthActions from './auth.actions';

import {
  AuthState,
  initialAuthState
} from './auth.state';

export const authReducer = createReducer(

  initialAuthState,

  // ============================================
  // REGISTER
  // ============================================

  on(
    AuthActions.register,
    state => ({
      ...state,
      loading: true,
      error: null
    })
  ),

  on(
    AuthActions.registerSuccess,
    state => ({
      ...state,
      loading: false,
      error: null
    })
  ),

  on(
    AuthActions.registerFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error
    })
  ),

  // ============================================
  // LOGIN
  // ============================================

  on(
    AuthActions.login,
    state => ({
      ...state,
      loading: true,
      error: null
    })
  ),

  on(
    AuthActions.loginSuccess,
    (state, { user }) => ({
      ...state,
      currentUser: user,
      isAuthenticated: true,
      loading: false,
      error: null
    })
  ),

  on(
    AuthActions.loginFailure,
    (state, { error }) => ({
      ...state,
      currentUser: null,
      isAuthenticated: false,
      loading: false,
      error
    })
  ),

  // ============================================
  // LOGOUT
  // ============================================

  on(
    AuthActions.logout,
    state => ({
      ...state,
      loading: true,
      error: null
    })
  ),

  on(
    AuthActions.logoutSuccess,
    () => ({
      ...initialAuthState
    })
  ),

  // ============================================
  // RESTORE SESSION
  // ============================================

  on(
    AuthActions.restoreSession,
    state => ({
      ...state,
      loading: true,
      error: null
    })
  ),

  on(
    AuthActions.restoreSessionSuccess,
    (state, { user }) => ({
      ...state,
      currentUser: user,
      isAuthenticated: !!user,
      loading: false,
      error: null
    })
  ),

  // ============================================
  // UPDATE PROFILE
  // ============================================

  on(
    AuthActions.updateProfile,
    state => ({
      ...state,
      loading: true,
      error: null
    })
  ),

  on(
    AuthActions.updateProfileSuccess,
    (state, { user }) => ({
      ...state,
      currentUser: user,
      isAuthenticated: true,
      loading: false,
      error: null
    })
  ),

  on(
    AuthActions.updateProfileFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error
    })
  ),

  // ============================================
  // UPDATE PROFILE IMAGE
  // ============================================

  on(
    AuthActions.updateProfileImage,
    state => ({
      ...state,
      loading: true,
      error: null
    })
  ),

  on(
    AuthActions.updateProfileImageSuccess,
    (state, { user }) => ({
      ...state,
      currentUser: user,
      isAuthenticated: true,
      loading: false,
      error: null
    })
  ),

  on(
    AuthActions.updateProfileImageFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error
    })
  ),

  // ============================================
  // CLEAR ERROR
  // ============================================

  on(
    AuthActions.clearAuthError,
    state => ({
      ...state,
      error: null
    })
  )

);
