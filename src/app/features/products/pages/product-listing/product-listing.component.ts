
import {
  Component,
  inject,
  OnInit,
  DestroyRef,
  HostListener
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Product } from '../../../../core/models/product.model';

// ==================== PRODUCTS STORE ====================

import {
  loadProducts
} from '../../../../store/products/products.actions';

import {
  selectAllProducts,
  selectProductsLoading,
  selectProductsError
} from '../../../../store/products/products.selectors';

// ==================== WISHLIST STORE ====================

import {
  loadWishlist,
  addToWishlist,
  removeFromWishlist
} from '../../../../store/wishlist/wishlist.actions';

import {
  selectWishlistProducts
} from '../../../../store/wishlist/wishlist.selectors';

// ==================== CART STORE ====================

import {
  addToCart
} from '../../../../store/cart/cart.actions';

import {
  selectCartItems
} from '../../../../store/cart/cart.selectors';

import { AuthService } from '../../../../core/services/auth.service';
import { PendingActionService } from '../../../../core/services/pending-action.service';

@Component({
  selector: 'app-product-listing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './product-listing.component.html',
  styleUrl: './product-listing.component.scss'
})
export class ProductListingComponent implements OnInit {

  // ============================================
  // INJECTIONS
  // ============================================

  private store = inject(Store);

  private destroyRef = inject(DestroyRef);

  private route = inject(ActivatedRoute);

  private router = inject(Router);

  private authService = inject(AuthService);

  private pendingActionService = inject(PendingActionService);


  // ============================================
  // DATA
  // ============================================

  products: Product[] = [];

  wishlist: Product[] = [];

  cartItems: { product: Product; quantity: number }[] = [];


  // ============================================
  // STATE
  // ============================================

  loading = true;

  error = '';

  searchTerm = '';

  selectedCategory = 'All';

  selectedBrand = 'All';

  selectedView = 'all';

  sortBy = 'default';


  // ============================================
  // CUSTOM DROPDOWN STATE
  // ============================================

  activeDropdown: 'category' | 'brand' | 'sort' | null = null;


  // ============================================
  // CATEGORY OPTIONS
  // ============================================

  categories: string[] = [
    'All',
    'Men',
    'Women',
    'Unisex'
  ];


  // ============================================
  // SORT OPTIONS
  // ============================================

  sortOptions = [
    {
      label: 'Default',
      value: 'default'
    },
    {
      label: 'Price: Low to High',
      value: 'price-low'
    },
    {
      label: 'Price: High to Low',
      value: 'price-high'
    },
    {
      label: 'Brand: A to Z',
      value: 'brand-az'
    },
    {
      label: 'Brand: Z to A',
      value: 'brand-za'
    },
    {
      label: 'Highest Rated',
      value: 'rating'
    },
    {
      label: 'Most Popular',
      value: 'popular'
    },
    {
      label: 'Name: A to Z',
      value: 'name'
    }
  ];


  // ============================================
  // PAGINATION
  // ============================================

  currentPage = 1;

  itemsPerPage = 8;


  // ============================================
  // INITIALIZATION
  // ============================================

  ngOnInit(): void {

    // ============================================
    // LOAD PRODUCTS FROM STORE
    // ============================================

    this.store.select(selectAllProducts)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(products => {

        this.products = products;

        this.currentPage = 1;

      });


    // ============================================
    // LOADING STATE
    // ============================================

    this.store.select(selectProductsLoading)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(loading => {

        this.loading = loading;

      });


    // ============================================
    // ERROR STATE
    // ============================================

    this.store.select(selectProductsError)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(error => {

        this.error = error ?? '';

      });


    // ============================================
    // WISHLIST PRODUCTS
    // ============================================

    this.store.select(selectWishlistProducts)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(products => {

        this.wishlist = products;

      });


    // ============================================
    // CART PRODUCTS
    // ============================================

    this.store.select(selectCartItems)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(items => {

        this.cartItems = items;

      });


    // ============================================
    // READ URL QUERY PARAMETERS
    // ============================================

    this.route.queryParamMap
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(params => {

        const category = params.get('category');

        const view = params.get('view');

        const brand = params.get('brand');


        // CATEGORY FILTER

        this.selectedCategory =
          this.categories.includes(category ?? '')
            ? category!
            : 'All';


        // TRENDING / BEST SELLERS FILTER

        this.selectedView =
          ['trending', 'bestsellers'].includes(view ?? '')
            ? view!
            : 'all';


        // BRAND FILTER

        this.selectedBrand = brand ?? 'All';


        // SEARCH FILTER

        this.searchTerm = params.get('search') ?? '';


        // RESET PAGINATION

        this.currentPage = 1;

      });


    // ============================================
    // LOAD PRODUCTS
    // ============================================

    this.loadProducts();


    // ============================================
    // LOAD WISHLIST
    // ============================================

    this.store.dispatch(loadWishlist());

  }


  // ============================================
  // LOAD PRODUCTS
  // ============================================

  loadProducts(): void {

    this.store.dispatch(loadProducts());

  }


  // ============================================
  // CHECK PRODUCT IN CART
  // ============================================

  isInCart(productId: number): boolean {

    return this.cartItems.some(
      item => item.product.id === productId
    );

  }


  // ============================================
  // BRANDS
  // ============================================

  get brands(): string[] {

    return [
      ...new Set(
        this.products.map(product => product.brand)
      )
    ].sort((a, b) => a.localeCompare(b));

  }


  // ============================================
  // BRAND OPTIONS FOR CUSTOM DROPDOWN
  // ============================================

  get brandOptions(): string[] {

    return [
      'All',
      ...this.brands
    ];

  }


  // ============================================
  // CATEGORY LABEL
  // ============================================

  get categoryLabel(): string {

    return this.selectedCategory;

  }


  // ============================================
  // BRAND LABEL
  // ============================================

  get brandLabel(): string {

    return this.selectedBrand;

  }


  // ============================================
  // SORT LABEL
  // ============================================

  get sortLabel(): string {

    const selectedOption = this.sortOptions.find(
      option => option.value === this.sortBy
    );

    return selectedOption?.label ?? 'Default';

  }


  // ============================================
  // CUSTOM DROPDOWN METHODS
  // ============================================

  toggleDropdown(
    dropdown: 'category' | 'brand' | 'sort'
  ): void {

    this.activeDropdown =
      this.activeDropdown === dropdown
        ? null
        : dropdown;

  }


  // ============================================
  // SELECT CATEGORY
  // ============================================

  selectCategory(category: string): void {

    this.selectedCategory = category;

    this.resetPagination();

    this.activeDropdown = null;

  }


  // ============================================
  // SELECT BRAND
  // ============================================

  selectBrand(brand: string): void {

    this.selectedBrand = brand;

    this.resetPagination();

    this.activeDropdown = null;

  }


  // ============================================
  // SELECT SORT
  // ============================================

  selectSort(value: string): void {

    this.sortBy = value;

    this.resetPagination();

    this.activeDropdown = null;

  }


  // ============================================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // ============================================

  @HostListener('document:click', ['$event'])
  closeDropdown(event: MouseEvent): void {

    const target = event.target as HTMLElement;

    if (!target.closest('.custom-dropdown')) {

      this.activeDropdown = null;

    }

  }


  // ============================================
  // FILTER AND SORT PRODUCTS
  // ============================================

  get filteredProducts(): Product[] {

    let result = [...this.products];


    // SEARCH BY NAME, BRAND, CATEGORY AND TAGS

    if (this.searchTerm.trim()) {

      const query = this.searchTerm.toLowerCase().trim();

      result = result.filter(product =>

        product.name.toLowerCase().includes(query) ||

        product.brand.toLowerCase().includes(query) ||

        product.category.toLowerCase().includes(query) ||

        product.tags?.some(tag =>
          tag.toLowerCase().includes(query)
        )

      );

    }


    // CATEGORY FILTER

    if (this.selectedCategory !== 'All') {

      result = result.filter(product =>
        product.category === this.selectedCategory
      );

    }


    // TRENDING COLLECTION

    if (this.selectedView === 'trending') {

      result.sort((a, b) =>
        b.rating - a.rating ||
        b.reviewCount - a.reviewCount
      );

      result = result.slice(0, 8);

    }


    // BEST SELLERS

    else if (this.selectedView === 'bestsellers') {

      result.sort((a, b) =>
        b.reviewCount - a.reviewCount
      );

      result = result.slice(0, 6);

    }


    // BRAND FILTER

    if (this.selectedBrand !== 'All') {

      result = result.filter(product =>
        product.brand === this.selectedBrand
      );

    }


    // SORTING

    switch (this.sortBy) {

      case 'price-low':

        result.sort((a, b) =>
          a.price - b.price
        );

        break;


      case 'price-high':

        result.sort((a, b) =>
          b.price - a.price
        );

        break;


      case 'brand-az':

        result.sort((a, b) =>
          a.brand.localeCompare(b.brand)
        );

        break;


      case 'brand-za':

        result.sort((a, b) =>
          b.brand.localeCompare(a.brand)
        );

        break;


      case 'rating':

        result.sort((a, b) =>
          b.rating - a.rating
        );

        break;


      case 'popular':

        result.sort((a, b) =>
          b.reviewCount - a.reviewCount
        );

        break;


      case 'name':

        result.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        break;


      case 'default':

      default:

        break;

    }


    return result;

  }


  // ============================================
  // PAGINATION
  // ============================================

  get totalPages(): number {

    return Math.ceil(
      this.filteredProducts.length / this.itemsPerPage
    );

  }


  // ============================================
  // PAGINATED PRODUCTS
  // ============================================

  get paginatedProducts(): Product[] {

    const startIndex =
      (this.currentPage - 1) * this.itemsPerPage;

    const endIndex =
      startIndex + this.itemsPerPage;

    return this.filteredProducts.slice(
      startIndex,
      endIndex
    );

  }


  // ============================================
  // PAGE NUMBERS
  // ============================================

  get pageNumbers(): number[] {

    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );

  }


  // ============================================
  // START ITEM
  // ============================================

  get startItem(): number {

    if (this.filteredProducts.length === 0) {
      return 0;
    }

    return (
      (this.currentPage - 1) * this.itemsPerPage + 1
    );

  }


  // ============================================
  // END ITEM
  // ============================================

  get endItem(): number {

    return Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredProducts.length
    );

  }


  // ============================================
  // PAGE NAVIGATION
  // ============================================

  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.currentPage
    ) {
      return;
    }

    this.currentPage = page;


    // SCROLL TO PRODUCT LISTING

    document.getElementById('products')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

  }


  // ============================================
  // NEXT PAGE
  // ============================================

  nextPage(): void {

    if (this.currentPage < this.totalPages) {

      this.goToPage(this.currentPage + 1);

    }

  }


  // ============================================
  // PREVIOUS PAGE
  // ============================================

  previousPage(): void {

    if (this.currentPage > 1) {

      this.goToPage(this.currentPage - 1);

    }

  }


  // ============================================
  // RESET PAGINATION
  // ============================================

  resetPagination(): void {

    this.currentPage = 1;

  }


  // ============================================
  // SEARCH CHANGE
  // ============================================

  onSearchChange(): void {

    this.resetPagination();

  }


  // ============================================
  // CLEAR FILTERS
  // ============================================

  clearFilters(): void {

    this.searchTerm = '';

    this.selectedCategory = 'All';

    this.selectedBrand = 'All';

    this.selectedView = 'all';

    this.sortBy = 'default';

    this.currentPage = 1;

    this.activeDropdown = null;

  }


  // ============================================
  // WISHLIST
  // ============================================

  toggleWishlist(product: Product): void {

    // CHECK LOGIN

    if (!this.authService.isLoggedIn()) {

      this.pendingActionService.saveAction({
        type: 'ADD_TO_WISHLIST',
        product
      });

      this.router.navigate(['/login']);

      return;

    }


    const alreadyInWishlist = this.isInWishlist(product.id);

    if (alreadyInWishlist) {

      this.store.dispatch(
        removeFromWishlist({
          productId: product.id
        })
      );

    } else {

      this.store.dispatch(
        addToWishlist({
          product
        })
      );

    }

  }


  // ============================================
  // CHECK WISHLIST
  // ============================================

  isInWishlist(productId: number): boolean {

    return this.wishlist.some(
      product => product.id === productId
    );

  }


  // ============================================
  // ADD TO CART / GO TO CART
  // ============================================

  addToCart(product: Product): void {

    // Already in cart: navigate without adding again.

    if (this.isInCart(product.id)) {

      this.router.navigate(['/cart']);

      return;

    }


    // STOCK CHECK

    if (product.stock < 1) {
      return;
    }


    // LOGIN CHECK

    if (!this.authService.isLoggedIn()) {

      this.pendingActionService.saveAction({
        type: 'ADD_TO_CART',
        product,
        quantity: 1
      });

      this.router.navigate(['/login']);

      return;

    }


    // ADD PRODUCT THROUGH NGRX

    this.store.dispatch(
      addToCart({
        product,
        quantity: 1
      })
    );

  }


  // ============================================
  // BUY NOW
  // ============================================

  buyNow(product: Product): void {

    if (!product || product.stock < 1) {
      return;
    }

    const quantity = 1;


    // USER IS NOT LOGGED IN

    if (!this.authService.isLoggedIn()) {

      this.pendingActionService.saveAction({
        type: 'BUY_NOW',
        product,
        quantity
      });

      this.router.navigate(['/login']);

      return;

    }


    // USER IS LOGGED IN
    // Direct checkout without adding to cart.

    this.router.navigate(['/checkout'], {
      queryParams: {
        productId: product.id,
        quantity
      }
    });

  }

}
