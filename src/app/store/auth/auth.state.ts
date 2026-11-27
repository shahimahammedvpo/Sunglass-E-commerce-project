import { AuthUser } from '../../core/models/user.model';

export interface AuthState {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  error: null
};