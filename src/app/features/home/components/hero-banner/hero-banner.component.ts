import {
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { HeroBannerService } from '../../../../core/services/hero-banner.service';

import { HeroBanner } from '../../../../core/models/hero-banner.model';

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './hero-banner.component.html',
  styleUrl: './hero-banner.component.scss'
})
export class HeroBannerComponent implements OnInit {

  heroBanner: HeroBanner | null = null;

  loading = true;

  errorMessage = '';

  constructor(
    private heroBannerService: HeroBannerService
  ) {}

  ngOnInit(): void {
    this.loadHeroBanner();
  }

  loadHeroBanner(): void {

    this.loading = true;

    this.heroBannerService.getHeroBanner().subscribe({

      next: (banner) => {

        this.heroBanner = banner;

        this.loading = false;

      },

      error: (error) => {

        console.error('Hero banner loading error:', error);

        this.errorMessage = 'Unable to load hero banner.';

        this.loading = false;

      }

    });

  }

}