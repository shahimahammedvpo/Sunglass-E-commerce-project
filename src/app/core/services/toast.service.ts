import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private toastSubject = new BehaviorSubject<ToastMessage[]>([]);

  toast$ = this.toastSubject.asObservable();

  private nextId = 1;

  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  show(
    message: string,
    type: ToastType = 'info',
    duration: number = 3000
  ): void {

    const toast: ToastMessage = {
      id: this.nextId++,
      message,
      type
    };

    const currentToasts = this.toastSubject.value;

    // Limit the number of visible toasts
    const updatedToasts = [
      ...currentToasts,
      toast
    ].slice(-5);

    this.toastSubject.next(updatedToasts);

    const timer = setTimeout(() => {
      this.remove(toast.id);
    }, duration);

    this.timers.set(toast.id, timer);
  }

  remove(id: number): void {

    const timer = this.timers.get(id);

    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.toastSubject.next(
      this.toastSubject.value.filter(
        toast => toast.id !== id
      )
    );

  }

  clear(): void {

    this.timers.forEach(timer => clearTimeout(timer));

    this.timers.clear();

    this.toastSubject.next([]);

  }

}