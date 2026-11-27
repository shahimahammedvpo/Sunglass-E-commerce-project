
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  Router,
  RouterOutlet,
  NavigationEnd
} from '@angular/router';

import {
  filter,
  map,
  startWith
} from 'rxjs';

import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,

  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ToastComponent
  ],

  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  private router = inject(Router);

  isAdminRoute$ = this.router.events.pipe(

    filter(event => event instanceof NavigationEnd),

    map(() => this.router.url.startsWith('/admin')),

    startWith(this.router.url.startsWith('/admin'))

  );

}
