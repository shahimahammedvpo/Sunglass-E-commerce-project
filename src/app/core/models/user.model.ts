export type UserRole = 'admin' | 'customer';

export interface User {
  id: number;
  fullName: string;
  email: string;
  password: string;
  profileImage?: string;

  role: UserRole;
  isBlocked: boolean;
}

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  profileImage?: string;

  role: UserRole;
  isBlocked: boolean;
}