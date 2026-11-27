import {
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Category } from '../../../../core/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-section',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './category-section.component.html',
  styleUrl: './category-section.component.scss'
})
export class CategorySectionComponent implements OnInit {

  categories: Category[] = [];

  loading = true;

  errorMessage = '';

  constructor(
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {

    this.loading = true;

    this.categoryService.getCategories().subscribe({

      next: (categories) => {

        this.categories = categories;

        this.loading = false;

      },

      error: (error) => {

        console.error('Category loading error:', error);

        this.errorMessage = 'Unable to load categories.';

        this.loading = false;

      }

    });

  }

}