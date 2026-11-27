import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-error',
  standalone: true,
  templateUrl: './form-error.component.html',
  styleUrl: './form-error.component.scss'
})
export class FormErrorComponent {

  @Input() control: AbstractControl | null = null;

  @Input() fieldName: string = 'Field';

  get errorMessage(): string {

    if (!this.control || !this.control.errors) {
      return '';
    }

    const errors = this.control.errors;

    if (errors['required']) {
      return `${this.fieldName} is required`;
    }

    if (errors['email']) {
      return 'Please enter a valid email address';
    }

    if (errors['minlength']) {
      return `${this.fieldName} must contain at least ${errors['minlength'].requiredLength} characters`;
    }

    if (errors['maxlength']) {
      return `${this.fieldName} cannot exceed ${errors['maxlength'].requiredLength} characters`;
    }

    if (errors['invalidMobile']) {
      return 'Enter a valid 10-digit mobile number';
    }

    if (errors['invalidPincode']) {
      return 'Enter a valid 6-digit PIN code';
    }

    if (errors['invalidName']) {
      return 'Name can only contain letters and spaces';
    }

    if (errors['minNameLength']) {
      return 'Name must contain at least 3 characters';
    }

    if (errors['minPasswordLength']) {
      return 'Password must contain at least 8 characters';
    }

    if (errors['missingUppercase']) {
      return 'Password must contain at least one uppercase letter';
    }

    if (errors['missingLowercase']) {
      return 'Password must contain at least one lowercase letter';
    }

    if (errors['missingNumber']) {
      return 'Password must contain at least one number';
    }

    if (errors['missingSpecialCharacter']) {
      return 'Password must contain at least one special character';
    }

    if (errors['pattern']) {
      return 'Please enter a valid value';
    }

    return 'Invalid value';
  }

}