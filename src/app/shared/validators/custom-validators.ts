import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';

export class CustomValidators {

  // Indian mobile number validation
  static indianMobile(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const mobile = String(control.value);
      const mobileRegex = /^[6-9]\d{9}$/;

      return mobileRegex.test(mobile)
        ? null
        : { invalidMobile: true };
    };
  }

  // Indian PIN code validation
  static indianPincode(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const pincode = String(control.value);
      const pincodeRegex = /^[1-9][0-9]{5}$/;

      return pincodeRegex.test(pincode)
        ? null
        : { invalidPincode: true };
    };
  }

  // Full name validation
  static fullName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const name = String(control.value).trim();
      const nameRegex = /^[a-zA-Z\s]+$/;

      if (!nameRegex.test(name)) {
        return { invalidName: true };
      }

      if (name.length < 3) {
        return { minNameLength: true };
      }

      return null;
    };
  }

  // City validation - letters and spaces only
  static city(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const city = String(control.value).trim();
      const cityRegex = /^[a-zA-Z\s]+$/;

      return cityRegex.test(city)
        ? null
        : { invalidCity: true };
    };
  }

  // State validation - letters and spaces only
  static state(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const state = String(control.value).trim();
      const stateRegex = /^[a-zA-Z\s]+$/;

      return stateRegex.test(state)
        ? null
        : { invalidState: true };
    };
  }

  // Strong password validation
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const password = String(control.value);

      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecialCharacter = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (password.length < 8) {
        return { minPasswordLength: true };
      }

      if (!hasUppercase) {
        return { missingUppercase: true };
      }

      if (!hasLowercase) {
        return { missingLowercase: true };
      }

      if (!hasNumber) {
        return { missingNumber: true };
      }

      if (!hasSpecialCharacter) {
        return { missingSpecialCharacter: true };
      }

      return null;
    };
  }
}