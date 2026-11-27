import { createAction, props } from '@ngrx/store';

import { AuthUser } from '../../core/models/user.model';

// ============================================
// REGISTER
// ============================================

export const register = createAction(
  '[Auth] Register',
  props<{
    fullName: string;
    email: string;
    password: string;
  }>()
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{
    message: string;
  }>()
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{
    error: string;
  }>()
);

// ============================================
// LOGIN
// ============================================

export const login = createAction(
  '[Auth] Login',
  props<{
    email: string;
    password: string;
  }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{
    user: AuthUser;
    message: string;
  }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{
    error: string;
  }>()
);

// ============================================
// LOGOUT
// ============================================

export const logout = createAction(
  '[Auth] Logout'
);

export const logoutSuccess = createAction(
  '[Auth] Logout Success'
);

// ============================================
// RESTORE SESSION
// ============================================

export const restoreSession = createAction(
  '[Auth] Restore Session'
);

export const restoreSessionSuccess = createAction(
  '[Auth] Restore Session Success',
  props<{
    user: AuthUser | null;
  }>()
);

// ============================================
// UPDATE PROFILE
// ============================================

export const updateProfile = createAction(
  '[Auth] Update Profile',
  props<{
    fullName: string;
    email: string;
  }>()
);

export const updateProfileSuccess = createAction(
  '[Auth] Update Profile Success',
  props<{
    user: AuthUser;
    message: string;
  }>()
);

export const updateProfileFailure = createAction(
  '[Auth] Update Profile Failure',
  props<{
    error: string;
  }>()
);

// ============================================
// UPDATE PROFILE IMAGE
// ============================================

export const updateProfileImage = createAction(
  '[Auth] Update Profile Image',
  props<{
    image: string;
  }>()
);

export const updateProfileImageSuccess = createAction(
  '[Auth] Update Profile Image Success',
  props<{
    user: AuthUser;
    message: string;
  }>()
);

export const updateProfileImageFailure = createAction(
  '[Auth] Update Profile Image Failure',
  props<{
    error: string;
  }>()
);

// ============================================
// CLEAR AUTH ERROR
// ============================================

export const clearAuthError = createAction(
  '[Auth] Clear Error'
);