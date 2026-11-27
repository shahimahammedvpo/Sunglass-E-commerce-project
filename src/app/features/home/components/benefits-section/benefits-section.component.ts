
import { Component } from '@angular/core';

@Component({
  selector: 'app-benefits-section',
  standalone: true,
  templateUrl: './benefits-section.component.html',
  styleUrl: './benefits-section.component.scss'
})
export class BenefitsSectionComponent {

  benefits = [
    {
      icon: 'bi-shield-check',
      title: 'UV400 Protection',
      description: 'Shop sunglasses with UV400 protection features.'
    },
    {
      icon: 'bi-gem',
      title: 'Premium Designs',
      description: 'Fashionable styles for every personality.'
    },
    {
      icon: 'bi-truck',
      title: 'Easy Delivery',
      description: 'Convenient delivery to your doorstep.'
    },
    {
      icon: 'bi-arrow-repeat',
      title: 'Easy Returns',
      description: 'Customer-friendly return experience.'
    }
  ];

}
