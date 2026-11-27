import {
  Component,
  inject,
  OnInit,
  DestroyRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { Store } from '@ngrx/store';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filter, take } from 'rxjs';

import { Order } from '../../../../core/models/order.model';

import { Address } from '../../../../core/models/address.model';

import { Product } from '../../../../core/models/product.model';

import { CartItem } from '../../../../core/services/cart.service';

import { AuthService } from '../../../../core/services/auth.service';

import { OrderService } from '../../../../core/services/order.service';

import { AddressService } from '../../../../core/services/address.service';

import { FormErrorComponent } from '../../../../shared/components/form-error/form-error.component';

import { CustomValidators } from '../../../../shared/validators/custom-validators';

import { loadProducts } from '../../../../store/products/products.actions';

import { selectAllProducts } from '../../../../store/products/products.selectors';

import { clearCart } from '../../../../store/cart/cart.actions';

import { CouponService } from '../../../../core/services/coupon.service';
import { Coupon } from '../../../../core/models/coupon.model';


@Component({
  selector: 'app-checkout',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    FormErrorComponent
  ],

  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {


  // --------------------------------------------------
  // INJECTIONS
  // --------------------------------------------------

  private route = inject(ActivatedRoute);

  private router = inject(Router);

  private authService = inject(AuthService);

  private orderService = inject(OrderService);

  private addressService = inject(AddressService);

  private store = inject(Store);

  private destroyRef = inject(DestroyRef);

  private couponService = inject(CouponService);


  // --------------------------------------------------
  // CHECKOUT MODE
  // --------------------------------------------------

  directPurchaseMode = false;

  directPurchaseProductId: number | null = null;


  // --------------------------------------------------
  // SAVED ADDRESSES
  // --------------------------------------------------

  addresses: Address[] = [];

  selectedAddressId: number | null = null;

  loadingAddresses = false;


  // --------------------------------------------------
  // PAYMENT METHOD
  // --------------------------------------------------

  paymentMethod: 'COD' | 'UPI' | 'CARD' = 'COD';


  // --------------------------------------------------
  // PAYMENT FORM
  // --------------------------------------------------

  paymentForm = new FormGroup({

    upiId: new FormControl('', [
      Validators.required,
      Validators.pattern(
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/
      )
    ]),

    cardHolderName: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      CustomValidators.fullName()
    ]),

    cardNumber: new FormControl('', [
      Validators.required,
      Validators.pattern(
        /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/
      )
    ]),

    expiryDate: new FormControl('', [
      Validators.required,
      Validators.pattern(
        /^(0[1-9]|1[0-2])\/([0-9]{2})$/
      )
    ]),

    cvv: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[0-9]{3,4}$/)
    ])

  });


  // --------------------------------------------------
  // CART / CHECKOUT ITEMS
  // --------------------------------------------------

  cartItems: CartItem[] = [];

  subtotal = 0;

  shipping = 0;

  discount = 0;

  total = 0;


  // --------------------------------------------------
  // COUPON
  // --------------------------------------------------

    couponCode = '';
    couponApplied = false;
    appliedCoupon: Coupon | null = null;
    applyingCoupon = false;


  // --------------------------------------------------
  // LOADING STATES
  // --------------------------------------------------

  loadingCart = false;

  placingOrder = false;


  // --------------------------------------------------
  // MESSAGES
  // --------------------------------------------------

  errorMessage = '';

  successMessage = '';


  // --------------------------------------------------
  // INIT
  // --------------------------------------------------

  ngOnInit(): void {

    // Determine checkout mode from query parameters
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {

        const productId = Number(params['productId']);

        const quantity = Number(
          params['quantity'] ?? 1
        );


        // ==================== BUY NOW ====================

        if (
          productId &&
          Number.isInteger(productId) &&
          productId > 0
        ) {

          this.directPurchaseMode = true;

          this.directPurchaseProductId = productId;

          this.loadDirectPurchaseProduct(
            productId,
            quantity
          );

        }


        // ==================== NORMAL CART CHECKOUT ====================

        else {

          this.directPurchaseMode = false;

          this.directPurchaseProductId = null;

          this.loadCart();

        }

      });


    this.loadSavedAddresses();

    this.updatePaymentValidators();

  }


  // --------------------------------------------------
  // LOAD DIRECT PURCHASE PRODUCT
  // --------------------------------------------------

  loadDirectPurchaseProduct(
    productId: number,
    quantity: number
  ): void {

    this.loadingCart = true;

    this.errorMessage = '';

    this.cartItems = [];

    this.calculateTotals();


    // Load products if they are not already available
    this.store
      .select(selectAllProducts)
      .pipe(
        filter(products => products.length > 0),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(products => {

        const product = products.find(
          item => item.id === productId
        );


        // ==================== PRODUCT NOT FOUND ====================

        if (!product) {

          this.cartItems = [];

          this.errorMessage = 'Product not found.';

          this.loadingCart = false;

          this.calculateTotals();

          return;

        }


        // ==================== VALIDATE QUANTITY ====================

       if (product.stock <= 0) {
          this.cartItems = [];
          this.errorMessage = 'This product is currently out of stock.';
          this.loadingCart = false;
          this.calculateTotals();
          return;
        }

        const validQuantity = Math.max(
          1,
          Math.min(
            Math.floor(quantity || 1),
            product.stock
          )
        );


        // ==================== DIRECT PURCHASE ITEM ====================

        this.cartItems = [
          {
            product,
            quantity: validQuantity
          }
        ];


        this.loadingCart = false;

        this.errorMessage = '';

        this.calculateTotals();

      });


    // Trigger product loading if necessary
    this.store
      .select(selectAllProducts)
      .pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(products => {

        if (products.length === 0) {

          this.store.dispatch(loadProducts());

        }

      });

  }


  // --------------------------------------------------
  // LOAD CART
  // --------------------------------------------------

  loadCart(): void {

    this.loadingCart = true;

    this.store
      .select((state: any) => state.cart)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cartState: any) => {


        // Do not overwrite direct purchase products
        if (this.directPurchaseMode) {

          return;

        }


        const items: CartItem[] =
          cartState?.items || [];


        this.cartItems = items;

        this.calculateTotals();

        this.loadingCart = false;

      });

  }


  // --------------------------------------------------
  // LOAD SAVED ADDRESSES
  // --------------------------------------------------

  loadSavedAddresses(): void {

    const currentUser = this.authService.getCurrentUser();


    if (!currentUser) {

      return;

    }


    this.loadingAddresses = true;


    this.addressService
      .getAddresses(currentUser.id)
      .subscribe({

        next: (addresses: Address[]) => {

          this.addresses = addresses;


          const defaultAddress = addresses.find(
            address => address.isDefault
          );


          if (defaultAddress) {

            this.selectedAddressId =
              defaultAddress.id!;

          } else if (addresses.length > 0) {

            this.selectedAddressId =
              addresses[0].id!;

          }


          this.loadingAddresses = false;

        },


        error: (error) => {

          console.error(
            'Saved addresses loading error:',
            error
          );


          this.loadingAddresses = false;

          this.errorMessage =
            'Unable to load saved addresses.';

        }

      });

  }


  // --------------------------------------------------
  // SELECT ADDRESS
  // --------------------------------------------------

  selectAddress(addressId: number): void {

    this.selectedAddressId = addressId;

    this.errorMessage = '';

  }


  // --------------------------------------------------
  // SELECTED ADDRESS
  // --------------------------------------------------

  get selectedAddress(): Address | undefined {

    return this.addresses.find(
      address => address.id === this.selectedAddressId
    );

  }


  // --------------------------------------------------
  // VALIDATE SAVED ADDRESS
  // --------------------------------------------------

  validateSelectedAddress(): boolean {

    const address = this.selectedAddress;


    if (!address) {

      return false;

    }


    const fullNameControl = new FormControl(
      address.fullName,
      [
        Validators.required,
        CustomValidators.fullName()
      ]
    );


    const phoneControl = new FormControl(
      address.phone,
      [
        Validators.required,
        CustomValidators.indianMobile()
      ]
    );


    const cityControl = new FormControl(
      address.city,
      [
        Validators.required,
        CustomValidators.city()
      ]
    );


    const stateControl = new FormControl(
      address.state,
      [
        Validators.required,
        CustomValidators.state()
      ]
    );


    const pincodeControl = new FormControl(
      address.postalCode,
      [
        Validators.required,
        CustomValidators.indianPincode()
      ]
    );


    return (
      fullNameControl.valid &&
      phoneControl.valid &&
      cityControl.valid &&
      stateControl.valid &&
      pincodeControl.valid
    );

  }


  // --------------------------------------------------
  // CALCULATE TOTALS
  // --------------------------------------------------

  calculateTotals(): void {
      this.subtotal = this.cartItems.reduce(
        (sum, item) => {
          const price = Number(item.product?.price) || 0;
          const quantity = Number(item.quantity) || 0;

          return sum + price * quantity;
        },
        0
      );

      // Free shipping for orders above ₹1000
      this.shipping = this.subtotal > 1000 ? 0 : 50;

      this.discount = 0;

      if (this.couponApplied && this.appliedCoupon) {
        const coupon = this.appliedCoupon;

        if (coupon.discountType === 'percentage') {
          this.discount =
            (this.subtotal * coupon.discountValue) / 100;

          if (coupon.maxDiscount !== null) {
            this.discount = Math.min(
              this.discount,
              coupon.maxDiscount
            );
          }
        } else {
          this.discount = coupon.discountValue;
        }

        // Discount cannot exceed the subtotal
        this.discount = Math.min(this.discount, this.subtotal);
      }

      this.total = Math.max(
        0,
        this.subtotal + this.shipping - this.discount
      );
  }


  // --------------------------------------------------
  // COUPON
  // --------------------------------------------------

  applyCoupon(): void {
      this.errorMessage = '';
      this.successMessage = '';

      const code = this.couponCode.trim().toUpperCase();

      if (!code) {
        this.errorMessage = 'Please enter a coupon code.';
        return;
      }

      if (this.subtotal <= 0) {
        this.errorMessage = 'Add products before applying a coupon.';
        return;
      }

      this.applyingCoupon = true;

      this.couponService.getCouponByCode(code).subscribe({
        next: (coupons) => {
          this.applyingCoupon = false;

          const coupon = coupons.find(
            item => item.code.toUpperCase() === code
          );

          if (!coupon) {
            this.errorMessage = 'Invalid coupon code.';
            return;
          }

          if (!coupon.isActive) {
            this.errorMessage = 'This coupon is currently inactive.';
            return;
          }

          const today = new Date().toISOString().split('T')[0];

          if (coupon.expiryDate < today) {
            this.errorMessage = 'This coupon has expired.';
            return;
          }

          if (this.subtotal < coupon.minOrderAmount) {
            this.errorMessage =
              `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}.`;
            return;
          }

          if (
            coupon.discountValue <= 0 ||
            (coupon.discountType === 'percentage' &&
              coupon.discountValue > 100)
          ) {
            this.errorMessage = 'This coupon has an invalid discount.';
            return;
          }

          this.appliedCoupon = coupon;
          this.couponCode = coupon.code;
          this.couponApplied = true;

          this.calculateTotals();

          this.successMessage =
            `Coupon ${coupon.code} applied successfully!`;
        },

        error: (error) => {
          console.error('Coupon validation error:', error);

          this.applyingCoupon = false;
          this.errorMessage =
            'Unable to validate coupon. Please try again.';
        }
      });
   }


  removeCoupon(): void {
      this.couponApplied = false;
      this.appliedCoupon = null;
      this.couponCode = '';

      this.calculateTotals();

      this.successMessage = '';
      this.errorMessage = '';
  }


  // --------------------------------------------------
  // PAYMENT METHOD
  // --------------------------------------------------

  selectPaymentMethod(
    method: 'COD' | 'UPI' | 'CARD'
  ): void {

    this.paymentMethod = method;

    this.errorMessage = '';

    this.successMessage = '';

    this.updatePaymentValidators();

  }


  // --------------------------------------------------
  // UPDATE PAYMENT VALIDATORS
  // --------------------------------------------------

  updatePaymentValidators(): void {

    const upiId =
      this.paymentForm.get('upiId');

    const cardHolderName =
      this.paymentForm.get('cardHolderName');

    const cardNumber =
      this.paymentForm.get('cardNumber');

    const expiryDate =
      this.paymentForm.get('expiryDate');

    const cvv =
      this.paymentForm.get('cvv');


    // Reset validators

    upiId?.clearValidators();

    cardHolderName?.clearValidators();

    cardNumber?.clearValidators();

    expiryDate?.clearValidators();

    cvv?.clearValidators();


    // UPI validators

    if (this.paymentMethod === 'UPI') {

      upiId?.setValidators([
        Validators.required,
        Validators.pattern(
          /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/
        )
      ]);

    }


    // CARD validators

    if (this.paymentMethod === 'CARD') {

      cardHolderName?.setValidators([
        Validators.required,
        Validators.minLength(3),
        CustomValidators.fullName()
      ]);


      cardNumber?.setValidators([
        Validators.required,
        Validators.pattern(
          /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/
        )
      ]);


      expiryDate?.setValidators([
        Validators.required,
        Validators.pattern(
          /^(0[1-9]|1[0-2])\/([0-9]{2})$/
        )
      ]);


      cvv?.setValidators([
        Validators.required,
        Validators.pattern(/^[0-9]{3,4}$/)
      ]);

    }


    // Update validity

    upiId?.updateValueAndValidity();

    cardHolderName?.updateValueAndValidity();

    cardNumber?.updateValueAndValidity();

    expiryDate?.updateValueAndValidity();

    cvv?.updateValueAndValidity();

  }


  // --------------------------------------------------
  // VALIDATE PAYMENT
  // --------------------------------------------------

  validatePayment(): boolean {

    if (this.paymentMethod === 'COD') {

      return true;

    }


    if (this.paymentForm.invalid) {

      this.paymentForm.markAllAsTouched();


      if (this.paymentMethod === 'UPI') {

        this.errorMessage =
          'Please enter a valid UPI ID.';

      } else {

        this.errorMessage =
          'Please complete all card details correctly.';

      }


      return false;

    }


    return true;

  }


  // --------------------------------------------------
  // PAYMENT VALIDITY
  // --------------------------------------------------

  get isPaymentValid(): boolean {

    if (this.paymentMethod === 'COD') {

      return true;

    }


    if (this.paymentMethod === 'UPI') {

      return this.paymentForm.get('upiId')?.valid ?? false;

    }


    if (this.paymentMethod === 'CARD') {

      return (
        this.paymentForm.get('cardHolderName')?.valid === true &&
        this.paymentForm.get('cardNumber')?.valid === true &&
        this.paymentForm.get('expiryDate')?.valid === true &&
        this.paymentForm.get('cvv')?.valid === true
      );

    }


    return false;

  }


  // --------------------------------------------------
  // PAYMENT METHOD LABEL
  // --------------------------------------------------

  getSelectedPaymentMethod(): string {

    switch (this.paymentMethod) {

      case 'COD':

        return 'Cash on Delivery';


      case 'UPI':

        return 'UPI Payment (Demo)';


      case 'CARD':

        return 'Card Payment (Demo)';


      default:

        return 'Cash on Delivery';

    }

  }


  // --------------------------------------------------
  // PLACE ORDER
  // --------------------------------------------------

  placeOrder(): void {

    this.errorMessage = '';

    this.successMessage = '';


    // CHECK CURRENT USER

    const currentUser =
      this.authService.getCurrentUser();


    if (!currentUser) {

      this.errorMessage =
        'Please login before placing an order.';

      this.router.navigate(['/login']);

      return;

    }


    // CHECK CHECKOUT ITEMS

    if (!this.cartItems.length) {

      this.errorMessage =
        this.directPurchaseMode
          ? 'The selected product is unavailable.'
          : 'Your cart is empty.';

      return;

    }


    // CHECK SELECTED ADDRESS

    if (!this.selectedAddress) {

      this.errorMessage =
        'Please select a delivery address.';

      return;

    }


    // VALIDATE SELECTED ADDRESS

    if (!this.validateSelectedAddress()) {

      this.errorMessage =
        'The selected address contains invalid information. Please update your saved address.';

      return;

    }


    // VALIDATE PAYMENT

    if (!this.validatePayment()) {

      return;

    }


    this.placingOrder = true;


    // ORDER DATA

    const address = this.selectedAddress;


    const orderData: Order = {

      customerId: currentUser.id,

      customerName: address.fullName,

      email: currentUser.email,


      // Cart checkout or direct Buy Now checkout
      items: this.cartItems,


      shippingAddress: {

        fullName: address.fullName,

        phone: address.phone,

        addressLine: [
          address.addressLine1,
          address.addressLine2
        ].filter(Boolean).join(', '),

        city: address.city,

        state: address.state,

        postalCode: address.postalCode

      },


      subtotal: this.subtotal,

      shippingCharge: this.shipping,

      discount: this.discount,

      totalAmount: this.total,

      couponCode: this.couponApplied
        ? this.couponCode
        : '',


      paymentMethod: this.getSelectedPaymentMethod(),

      status: 'Pending',

      createdAt: new Date().toISOString()

    };


    // CREATE ORDER

    this.orderService
      .createOrder(orderData)
      .subscribe({

        next: (order: Order) => {

          this.placingOrder = false;

          // Clear cart only for normal cart checkout
          if (!this.directPurchaseMode) {
            this.store.dispatch(clearCart());
          }

          // Navigate to order confirmation
          this.router.navigate([
            '/order-confirmation',
            order.id
          ]);

        },


        error: (error: any) => {

          console.error(
            'Order creation error:',
            error
          );


          this.placingOrder = false;

          this.errorMessage =
            'Unable to place your order. Please try again.';

        }

      });

  }

}