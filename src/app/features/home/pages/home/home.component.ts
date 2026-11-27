
import {
  Component,
  inject,
  OnInit,
  DestroyRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Product } from '../../../../core/models/product.model';

import { loadProducts } from '../../../../store/products/products.actions';

import {
  selectAllProducts,
  selectProductsLoading,
  selectProductsError
} from '../../../../store/products/products.selectors';

import { HeroBannerComponent } from '../../components/hero-banner/hero-banner.component';
import { CategorySectionComponent } from '../../components/category-section/category-section.component';
import { TrendingProductsComponent } from '../../components/trending-products/trending-products.component';
import { BenefitsSectionComponent } from '../../components/benefits-section/benefits-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroBannerComponent,
    CategorySectionComponent,
    TrendingProductsComponent,
    BenefitsSectionComponent
],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {

  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  products: Product[] = [];

  loading = true;
  error = '';

  ngOnInit(): void {

    // Get products from NgRx Store
    this.store.select(selectAllProducts)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(products => {
        this.products = products;
      });

    // Get loading status
    this.store.select(selectProductsLoading)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(loading => {
        this.loading = loading;
      });

    // Get error message
    this.store.select(selectProductsError)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(error => {
        this.error = error ?? '';
      });

    // Request products
    this.store.dispatch(loadProducts());

  }

  // Get top 8 trending products
  get trendingProducts(): Product[] {

    return [...this.products]
      .sort((a, b) =>
        b.rating !== a.rating
          ? b.rating - a.rating
          : b.reviewCount - a.reviewCount
      )
      .slice(0, 8);

  }

}
