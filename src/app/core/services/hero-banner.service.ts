import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { HeroBanner } from '../models/hero-banner.model';

@Injectable({
  providedIn: 'root'
})
export class HeroBannerService {

  private apiUrl = 'http://localhost:3000/heroBanner';

  constructor(private http: HttpClient) {}

  getHeroBanner(): Observable<HeroBanner> {
    return this.http.get<HeroBanner>(this.apiUrl);
  }

  updateHeroBanner(banner: HeroBanner): Observable<HeroBanner> {
    return this.http.put<HeroBanner>(
      `${this.apiUrl}`,
      banner
    );
  }
}