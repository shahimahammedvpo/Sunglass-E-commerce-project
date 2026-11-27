import { Injectable } from '@angular/core';

export type PendingActionType =
  | 'ADD_TO_CART'
  | 'ADD_TO_WISHLIST'
  | 'NAVIGATE'
  | 'BUY_NOW';

export interface PendingAction {
  type: PendingActionType;
  product?: any;
  quantity?: number;
  route?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PendingActionService {

  private readonly storageKey = 'pendingAction';

  // Save the action before redirecting to login
  saveAction(action: PendingAction): void {
    sessionStorage.setItem(
      this.storageKey,
      JSON.stringify(action)
    );
  }

  // Retrieve the pending action after login
  getAction(): PendingAction | null {
    const action = sessionStorage.getItem(this.storageKey);

    return action ? JSON.parse(action) : null;
  }

  // Remove the action after executing it
  clearAction(): void {
    sessionStorage.removeItem(this.storageKey);
  }

  // Check whether an action is pending
  hasPendingAction(): boolean {
    return sessionStorage.getItem(this.storageKey) !== null;
  }
}