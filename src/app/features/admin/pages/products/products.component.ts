
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Product } from '../../../../core/models/product.model';
import { AdminProductsService } from '../../services/admin-products.service';

type ProductForm = Omit<Product, 'id'>;

type FieldName =
  | 'name'
  | 'brand'
  | 'description'
  | 'price'
  | 'originalPrice'
  | 'stock'
  | 'rating'
  | 'reviewCount'
  | 'image';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {

  private productsService = inject(AdminProductsService);

  products: Product[] = [];

  loading = false;
  saving = false;
  deleting = false;

  errorMessage = '';
  successMessage = '';

  // Message timeout
  private messageTimeout: ReturnType<typeof setTimeout> | null = null;
  readonly messageDuration = 3000;

  private readonly textOnlyPattern = /^[A-Za-z\s&'.-]+$/;

  searchTerm = '';
  selectedCategory = 'all';
  selectedBrand = 'all';

  currentPage = 1;
  itemsPerPage = 5;

  showProductModal = false;
  showDeleteModal = false;
  isEditMode = false;

  selectedProduct: Product | null = null;

  form: ProductForm = this.createEmptyForm();

  // Form validation
  submitted = false;
  touchedFields: Partial<Record<FieldName, boolean>> = {};

  // Image upload
  imagePreview = '';
  imageError = '';
  readonly maxImageSize = 5 * 1024 * 1024;

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.clearMessageTimer();
  }

  // -------------------------------
  // REUSABLE MESSAGE HANDLING
  // -------------------------------

  private showMessage(
    type: 'success' | 'error',
    message: string
  ): void {

    // Clear previous timer
    this.clearMessageTimer();

    // Clear previous messages
    this.successMessage = '';
    this.errorMessage = '';

    // Display new message
    if (type === 'success') {
      this.successMessage = message;
    } else {
      this.errorMessage = message;
    }

    // Automatically hide after 3 seconds
    this.messageTimeout = setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
      this.messageTimeout = null;
    }, this.messageDuration);
  }

  private clearMessageTimer(): void {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.clearMessageTimer();
  }

  // -------------------------------
  // INITIAL FORM
  // -------------------------------

  private createEmptyForm(): ProductForm {
    return {
      name: '',
      brand: '',
      category: 'Unisex',
      description: '',
      price: 0,
      originalPrice: 0,
      rating: 0,
      reviewCount: 0,
      discount: 0,
      stock: 0,
      image: '',
      features: [],
      tags: [],
      isFeatured: false
    };
  }

  // -------------------------------
  // LOAD PRODUCTS
  // -------------------------------

  loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';

    this.productsService.getProducts().subscribe({
      next: products => {
        this.products = products;
        this.loading = false;

        this.currentPage = Math.min(
          this.currentPage,
          Math.max(1, this.totalPages)
        );
      },
      error: error => {
        console.error('Failed to load products:', error);

        this.loading = false;

        this.showMessage(
          'error',
          'Unable to load products. Please try again.'
        );
      }
    });
  }

  // -------------------------------
  // PRODUCT FILTERS
  // -------------------------------

  get brands(): string[] {
    return [...new Set(
      this.products
        .map(product => product.brand)
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }

  get filteredProducts(): Product[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.products.filter(product => {
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.brand.toLowerCase().includes(search);

      const matchesCategory =
        this.selectedCategory === 'all' ||
        product.category === this.selectedCategory;

      const matchesBrand =
        this.selectedBrand === 'all' ||
        product.brand === this.selectedBrand;

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }

  get totalProducts(): number {
    return this.products.length;
  }

  // -------------------------------
  // PAGINATION
  // -------------------------------

  get totalPages(): number {
    return Math.ceil(
      this.filteredProducts.length / this.itemsPerPage
    );
  }

  get paginatedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;

    return this.filteredProducts.slice(
      start,
      start + this.itemsPerPage
    );
  }

  get pageNumbers(): number[] {
    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }

  get startItem(): number {
    return this.filteredProducts.length === 0
      ? 0
      : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredProducts.length
    );
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    this.changePage(this.currentPage - 1);
  }

  nextPage(): void {
    this.changePage(this.currentPage + 1);
  }

  // -------------------------------
  // ADD PRODUCT
  // -------------------------------

  openAddProduct(): void {
    this.isEditMode = false;
    this.selectedProduct = null;
    this.form = this.createEmptyForm();

    this.resetFormValidation();

    this.errorMessage = '';
    this.imagePreview = '';
    this.imageError = '';

    this.showProductModal = true;
  }

  // -------------------------------
  // EDIT PRODUCT
  // -------------------------------

  openEditProduct(product: Product): void {
    this.isEditMode = true;
    this.selectedProduct = product;

    this.form = {
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      rating: product.rating,
      reviewCount: product.reviewCount,
      discount: product.discount,
      stock: product.stock,
      image: product.image,
      features: [...(product.features || [])],
      tags: [...(product.tags || [])],
      isFeatured: product.isFeatured
    };

    this.resetFormValidation();

    this.imagePreview = product.image || '';
    this.imageError = '';
    this.errorMessage = '';

    this.showProductModal = true;
  }

  closeProductModal(): void {
    if (this.saving) return;

    this.showProductModal = false;
    this.selectedProduct = null;
    this.errorMessage = '';
  }

  // -------------------------------
  // LIVE VALIDATION
  // -------------------------------

  resetFormValidation(): void {
    this.submitted = false;
    this.touchedFields = {};
  }

  markTouched(field: FieldName): void {
    this.touchedFields[field] = true;
  }

  showFieldError(field: FieldName): boolean {
    return !!(
      this.submitted ||
      this.touchedFields[field]
    ) && !!this.getFieldError(field);
  }

  getFieldError(field: FieldName): string {
    switch (field) {

      case 'name':
        if (!this.form.name.trim()) {
          return 'Product name is required.';
        }

        if (this.form.name.trim().length < 3) {
          return 'Product name must contain at least 3 characters.';
        }

        if (!this.textOnlyPattern.test(this.form.name.trim())) {
          return 'Product name must not contain numbers or special characters.';
        }

        return '';

      case 'brand':
        if (!this.form.brand.trim()) {
          return 'Brand name is required.';
        }

        if (!this.textOnlyPattern.test(this.form.brand.trim())) {
          return 'Brand must not contain numbers or special characters.';
        }

        return '';

      case 'description':
        if (!this.form.description.trim()) {
          return 'Product description is required.';
        }

        if (this.form.description.trim().length < 10) {
          return 'Description must contain at least 10 characters.';
        }

        return '';

      case 'price':
        if (
          this.form.price === null ||
          this.form.price === undefined ||
          this.form.price <= 0
        ) {
          return 'Selling price must be greater than 0.';
        }

        if (
          this.form.originalPrice > 0 &&
          this.form.price > this.form.originalPrice
        ) {
          return 'Selling price cannot exceed original price.';
        }

        return '';

      case 'originalPrice':
        if (
          this.form.originalPrice === null ||
          this.form.originalPrice === undefined ||
          this.form.originalPrice <= 0
        ) {
          return 'Original price must be greater than 0.';
        }

        if (
          this.form.price > 0 &&
          this.form.originalPrice < this.form.price
        ) {
          return 'Original price must be at least the selling price.';
        }

        return '';

      case 'stock':
        if (
          this.form.stock === null ||
          this.form.stock === undefined ||
          this.form.stock < 0
        ) {
          return 'Stock cannot be negative.';
        }

        return '';

      case 'rating':
        if (
          this.form.rating === null ||
          this.form.rating === undefined ||
          this.form.rating < 0 ||
          this.form.rating > 5
        ) {
          return 'Rating must be between 0 and 5.';
        }

        return '';

      case 'reviewCount':
        if (
          this.form.reviewCount === null ||
          this.form.reviewCount === undefined ||
          this.form.reviewCount < 0
        ) {
          return 'Review count cannot be negative.';
        }

        return '';

      case 'image':
        if (!this.form.image) {
          return 'Please upload a product image.';
        }

        return '';
    }
  }

  validateForm(): boolean {
    const fields: FieldName[] = [
      'name',
      'brand',
      'description',
      'price',
      'originalPrice',
      'stock',
      'rating',
      'reviewCount',
      'image'
    ];

    let valid = true;

    fields.forEach(field => {
      this.touchedFields[field] = true;

      if (this.getFieldError(field)) {
        valid = false;
      }
    });

    if (this.imageError) {
      valid = false;
    }

    return valid;
  }

  // -------------------------------
  // IMAGE UPLOAD
  // -------------------------------

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.imageError = '';
    this.markTouched('image');

    if (!file.type.startsWith('image/')) {
      this.imageError = 'Please select a valid image file.';
      input.value = '';
      return;
    }

    if (file.size > this.maxImageSize) {
      this.imageError = 'Image size must not exceed 5 MB.';
      input.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result === 'string') {
        this.form.image = result;
        this.imagePreview = result;
        this.imageError = '';
      }
    };

    reader.onerror = () => {
      this.imageError = 'Unable to read the selected image.';
      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.form.image = '';
    this.imagePreview = '';
    this.imageError = '';
    this.markTouched('image');
  }

  // -------------------------------
  // SAVE PRODUCT
  // -------------------------------

  saveProduct(): void {
    this.submitted = true;

    if (!this.validateForm()) {
      this.showMessage(
        'error',
        'Please correct the highlighted fields.'
      );
      return;
    }

    const payload: ProductForm = {
      ...this.form,
      name: this.form.name.trim(),
      brand: this.form.brand.trim(),
      description: this.form.description.trim(),
      image: this.form.image,
      discount: Math.round(
        ((this.form.originalPrice - this.form.price) /
          this.form.originalPrice) * 100
      )
    };

    this.saving = true;
    this.errorMessage = '';

    const request =
      this.isEditMode && this.selectedProduct
        ? this.productsService.updateProduct(
            this.selectedProduct.id,
            payload
          )
        : this.productsService.addProduct(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.showProductModal = false;

        this.showMessage(
          'success',
          this.isEditMode
            ? 'Product updated successfully.'
            : 'Product added successfully.'
        );

        this.loadProducts();
      },
      error: error => {
        console.error('Failed to save product:', error);

        this.saving = false;

        this.showMessage(
          'error',
          'Unable to save the product. Please try again.'
        );
      }
    });
  }

  // -------------------------------
  // DELETE PRODUCT
  // -------------------------------

  openDeleteConfirmation(product: Product): void {
    this.selectedProduct = product;
    this.showDeleteModal = true;
    this.errorMessage = '';
  }

  cancelDelete(): void {
    if (this.deleting) return;

    this.showDeleteModal = false;
    this.selectedProduct = null;
  }

  confirmDelete(): void {
    if (!this.selectedProduct) return;

    this.deleting = true;
    this.errorMessage = '';

    this.productsService.deleteProduct(
      this.selectedProduct.id
    ).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteModal = false;

        this.selectedProduct = null;

        this.showMessage(
          'success',
          'Product deleted successfully.'
        );

        this.loadProducts();
      },
      error: error => {
        console.error('Failed to delete product:', error);

        this.deleting = false;

        this.showMessage(
          'error',
          'Unable to delete the product. Please try again.'
        );
      }
    });
  }

  // -------------------------------
  // FEATURES AND TAGS
  // -------------------------------

  get featuresText(): string {
    return this.form.features.join(', ');
  }

  set featuresText(value: string) {
    this.form.features = value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  get tagsText(): string {
    return this.form.tags.join(', ');
  }

  set tagsText(value: string) {
    this.form.tags = value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  // -------------------------------
  // CUSTOM FILTER DROPDOWNS
  // -------------------------------

  isCategoryDropdownOpen = false;
  isBrandDropdownOpen = false;

  toggleCategoryDropdown(): void {
    this.isCategoryDropdownOpen = !this.isCategoryDropdownOpen;
    this.isBrandDropdownOpen = false;
  }

  toggleBrandDropdown(): void {
    this.isBrandDropdownOpen = !this.isBrandDropdownOpen;
    this.isCategoryDropdownOpen = false;
  }

  closeAllDropdowns(): void {
    this.isCategoryDropdownOpen = false;
    this.isBrandDropdownOpen = false;
  }

  selectCategory(
    category: 'all' | 'Men' | 'Women' | 'Unisex'
  ): void {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.closeAllDropdowns();
  }

  selectBrand(brand: string): void {
    this.selectedBrand = brand;
    this.currentPage = 1;
    this.closeAllDropdowns();
  }
}
